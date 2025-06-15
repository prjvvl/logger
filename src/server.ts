import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { ConfigManager } from './config';
import { LogValidator } from './validator';
import { LogStorage } from './storage';
import { AlertManager } from './alerts';
import { ApiResponse, LogsResponse, LogQuery } from './types';

class LoggerServer {
  private app: express.Application;
  private config: ConfigManager;
  private storage: LogStorage;
  private alertManager: AlertManager;  private port: number;
  private host: string;
    constructor() {
    this.app = express();
    this.config = ConfigManager.getInstance();
    this.storage = new LogStorage();
    this.alertManager = new AlertManager();
    this.port = parseInt(process.env.PORT || '0') || this.config.getAppConfig().port;
    this.host = process.env.HOST || this.config.getAppConfig().host || '127.0.0.1'; // Default to localhost for development

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    
    // Rate limiting
    const rateLimitConfig = this.config.getAppConfig().rate_limit;
    const limiter = rateLimit({
      windowMs: rateLimitConfig.window_ms,
      max: rateLimitConfig.max_requests,
      message: { success: false, error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));

    // Error handling middleware
    this.app.use(this.errorHandler.bind(this));
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        success: true, 
        message: 'Logger server is running',
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.app.post('/api/logs', this.handleLogSubmission.bind(this));
    this.app.get('/api/logs', this.handleLogRetrieval.bind(this));
    this.app.get('/api/sources', this.handleGetSources.bind(this));
    this.app.get('/api/groups', this.handleGetGroups.bind(this));
    this.app.get('/api/test-alert', this.handleTestAlert.bind(this));

    // Catch-all route
    this.app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  private async handleLogSubmission(req: Request, res: Response): Promise<void> {
    try {
      // Validate Bearer token
      const authValidation = LogValidator.validateBearerToken(req.headers.authorization);
      if (!authValidation.valid) {
        res.status(401).json({ 
          success: false, 
          error: authValidation.error 
        } as ApiResponse);
        return;
      }

      // Extract token and validate against source
      const token = LogValidator.extractBearerToken(req.headers.authorization!);
      if (!this.config.validateToken(req.body.source, token)) {
        res.status(401).json({ 
          success: false, 
          error: 'Invalid authentication token for the specified source' 
        } as ApiResponse);
        return;
      }

      // Validate log data
      const logValidation = LogValidator.validateLog(req.body);
      if (!logValidation.valid) {
        res.status(400).json({ 
          success: false, 
          error: logValidation.error 
        } as ApiResponse);
        return;
      }

      // Sanitize and save log
      const sanitizedLog = LogValidator.sanitizeLog(req.body);
      await this.storage.saveLog(sanitizedLog);

      // Process alert if needed
      await this.alertManager.processLog(sanitizedLog);

      res.status(201).json({ 
        success: true, 
        message: 'Log saved successfully' 
      } as ApiResponse);

    } catch (error) {
      console.error('Error in log submission:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error while saving log' 
      } as ApiResponse);
    }
  }

  private async handleLogRetrieval(req: Request, res: Response): Promise<void> {
    try {
      // Validate Bearer token
      const authValidation = LogValidator.validateBearerToken(req.headers.authorization);
      if (!authValidation.valid) {
        res.status(401).json({ 
          success: false, 
          error: authValidation.error 
        } as ApiResponse);
        return;
      }

      // Extract token (for future use in filtering by source)
      const token = LogValidator.extractBearerToken(req.headers.authorization!);

      // Parse query parameters
      const query: LogQuery = {
        source: req.query.source as string,
        level: req.query.level as string,
        action: req.query.action as string,
        group: req.query.group as string,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined
      };

      // Retrieve logs
      const result = await this.storage.getLogs(query);

      res.json({
        success: true,
        ...result
      } as LogsResponse);

    } catch (error) {
      console.error('Error in log retrieval:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error while retrieving logs' 
      } as ApiResponse);
    }
  }

  private async handleGetSources(req: Request, res: Response): Promise<void> {
    try {
      const sources = await this.storage.getSourcesList();
      res.json({ success: true, data: sources } as ApiResponse);
    } catch (error) {
      console.error('Error getting sources:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve sources' 
      } as ApiResponse);
    }
  }

  private async handleGetGroups(req: Request, res: Response): Promise<void> {
    try {
      const source = req.query.source as string;
      const groups = await this.storage.getGroupsList(source);
      res.json({ success: true, data: groups } as ApiResponse);
    } catch (error) {
      console.error('Error getting groups:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve groups' 
      } as ApiResponse);
    }
  }

  private async handleTestAlert(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.alertManager.testTelegramConnection();
      const status = this.alertManager.getRateLimitStatus();
      
      res.json({ 
        success: true, 
        data: { 
          telegram_test: success,
          rate_limit_status: status
        } 
      } as ApiResponse);
    } catch (error) {
      console.error('Error testing alert:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to test alert system' 
      } as ApiResponse);
    }
  }

  private errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
    console.error('Unhandled error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      } as ApiResponse);
    }
  }
  public start(): void {
    this.app.listen(this.port, this.host, () => {
      console.log(`Logger server running on ${this.host}:${this.port}`);
      console.log(`Health check: http://${this.host}:${this.port}/health`);
      console.log(`Web interface: http://${this.host}:${this.port}`);
      
      if (this.host === '0.0.0.0') {
        console.log(`Server is publicly accessible on all network interfaces`);
        console.log(`Local access: http://localhost:${this.port}`);
      }
    });
  }
}

// Start the server
if (require.main === module) {
  const server = new LoggerServer();
  server.start();
}

export default LoggerServer;
