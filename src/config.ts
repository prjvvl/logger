import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';
import { AppConfig, AuthTokens, AlertConfig } from './types';

// Load environment variables
dotenv.config();

export class ConfigManager {
  private static instance: ConfigManager;
  private appConfig!: AppConfig;
  private authTokens!: AuthTokens;
  private alertConfig!: AlertConfig;

  private constructor() {
    this.loadConfigurations();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfigurations(): void {
    this.loadAppConfig();
    this.loadAuthTokens();
    this.loadAlertConfig();
  }  private loadAppConfig(): void {
    // Load from environment variables only
    this.appConfig = {
      port: parseInt(process.env.PORT || '3000'),
      logs_directory: process.env.LOGS_DIRECTORY || './logs',
      max_log_file_size: process.env.MAX_LOG_FILE_SIZE || '10MB',
      log_retention_days: parseInt(process.env.LOG_RETENTION_DAYS || '30'),
      allowed_sources: process.env.ALLOWED_SOURCES ? 
        JSON.parse(process.env.ALLOWED_SOURCES) : [],
      rate_limit: {
        window_ms: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        max_requests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
      }
    };
  }
  private loadAuthTokens(): void {
    // Load from environment variables only
    if (process.env.AUTH_TOKENS) {
      try {
        this.authTokens = JSON.parse(process.env.AUTH_TOKENS);
        return;
      } catch (error) {
        console.error('Error parsing AUTH_TOKENS from environment:', (error as Error).message);
      }
    }

    // Use defaults if no environment variable
    console.log('No AUTH_TOKENS found, using defaults...');
    this.authTokens = this.getDefaultAuthTokens();
  }
  private loadAlertConfig(): void {
    // Load from environment variables only
    this.alertConfig = {
      telegram: {
        bot_token: process.env.TELEGRAM_BOT_TOKEN || 'your_telegram_bot_token',
        chat_id: process.env.TELEGRAM_CHAT_ID || 'your_chat_id',
        enabled: process.env.TELEGRAM_ENABLED === 'true',
        alert_levels: ['error', 'warning'],
        rate_limit: {
          max_alerts_per_minute: parseInt(process.env.ALERT_MAX_PER_MINUTE || '5'),
          cooldown_minutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '10')
        }
      }
    };
  }

  private getDefaultAppConfig(): AppConfig {
    return {
      port: 3000,
      logs_directory: './logs',
      max_log_file_size: '10MB',
      log_retention_days: 30,
      allowed_sources: [],
      rate_limit: {
        window_ms: 60000, // 1 minute
        max_requests: 100
      }
    };
  }

  private getDefaultAuthTokens(): AuthTokens {
    return {
      'test_site': 'test123token456',
      'demo_app': 'demo789token123'
    };
  }

  private getDefaultAlertConfig(): AlertConfig {
    return {
      telegram: {
        bot_token: 'your_telegram_bot_token',
        chat_id: 'your_chat_id',
        enabled: false,
        alert_levels: ['error', 'warning'],
        rate_limit: {
          max_alerts_per_minute: 5,
          cooldown_minutes: 10
        }
      }
    };
  }

  private saveAppConfig(): void {
    const configPath = path.join(process.cwd(), 'config', 'config.json');
    fs.ensureDirSync(path.dirname(configPath));
    fs.writeJsonSync(configPath, this.appConfig, { spaces: 2 });
  }

  private saveAuthTokens(): void {
    const authPath = path.join(process.cwd(), 'config', 'auth_tokens.json');
    fs.ensureDirSync(path.dirname(authPath));
    fs.writeJsonSync(authPath, this.authTokens, { spaces: 2 });
  }

  private saveAlertConfig(): void {
    const alertPath = path.join(process.cwd(), 'config', 'alerts.json');
    fs.ensureDirSync(path.dirname(alertPath));
    fs.writeJsonSync(alertPath, this.alertConfig, { spaces: 2 });
  }

  // Getters
  public getAppConfig(): AppConfig {
    return this.appConfig;
  }

  public getAuthTokens(): AuthTokens {
    return this.authTokens;
  }

  public getAlertConfig(): AlertConfig {
    return this.alertConfig;
  }

  // Auth token validation
  public validateToken(source: string, token: string): boolean {
    return this.authTokens[source] === token;
  }

  // Reload configurations
  public reloadConfigurations(): void {
    this.loadConfigurations();
  }
}
