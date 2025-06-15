import path from 'path';
import fs from 'fs-extra';
import moment from 'moment';
import { LogEntry } from './types';
import { ConfigManager } from './config';

export class LogStorage {
  private config: ConfigManager;

  constructor() {
    this.config = ConfigManager.getInstance();
  }

  async saveLog(log: LogEntry): Promise<void> {
    const date = moment(log.timestamp);
    const monthYear = date.format('MM-YYYY');
    const day = date.format('DD');
    
    const logsDir = this.config.getAppConfig().logs_directory;
    const logDir = path.join(logsDir, log.source, monthYear, day);
    const logFile = path.join(logDir, `${log.group}.json`);
    
    // Ensure directory exists
    await fs.ensureDir(logDir);
    
    try {
      // Read existing logs for this group
      let logs: LogEntry[] = [];
      
      if (await fs.pathExists(logFile)) {
        const fileContent = await fs.readFile(logFile, 'utf8');
        if (fileContent.trim()) {
          logs = fileContent
            .trim()
            .split('\n')
            .map(line => JSON.parse(line));
        }
      }
      
      // Add new log
      logs.push(log);
      
      // Sort by position
      logs.sort((a, b) => a.position - b.position);
      
      // Write back to file (one JSON object per line)
      const content = logs.map(l => JSON.stringify(l)).join('\n') + '\n';
      await fs.writeFile(logFile, content);
      
    } catch (error) {
      console.error('Error saving log:', error);
      throw new Error('Failed to save log to storage');
    }
  }

  async getLogs(query: {
    source?: string;
    level?: string;
    action?: string;
    group?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    page?: number;
  }): Promise<{ logs: LogEntry[]; total: number; page: number; total_pages: number }> {
    const limit = query.limit || 100;
    const page = query.page || 1;
    const logsDir = this.config.getAppConfig().logs_directory;
    
    try {
      const allLogs: LogEntry[] = [];
      
      // If source is specified, only read from that source
      const sources = query.source ? [query.source] : await this.getAllSources();
      
      for (const source of sources) {
        const sourcePath = path.join(logsDir, source);
        if (!(await fs.pathExists(sourcePath))) continue;
        
        const monthYears = await fs.readdir(sourcePath);
        
        for (const monthYear of monthYears) {
          const monthPath = path.join(sourcePath, monthYear);
          if (!(await fs.stat(monthPath)).isDirectory()) continue;
          
          const days = await fs.readdir(monthPath);
          
          for (const day of days) {
            const dayPath = path.join(monthPath, day);
            if (!(await fs.stat(dayPath)).isDirectory()) continue;
            
            const groups = await fs.readdir(dayPath);
            
            for (const groupFile of groups) {
              if (!groupFile.endsWith('.json')) continue;
              
              const groupPath = path.join(dayPath, groupFile);
              const fileContent = await fs.readFile(groupPath, 'utf8');
              
              if (fileContent.trim()) {
                const logs = fileContent
                  .trim()
                  .split('\n')
                  .map(line => JSON.parse(line));
                
                allLogs.push(...logs);
              }
            }
          }
        }
      }
      
      // Filter logs
      let filteredLogs = allLogs;
      
      if (query.level) {
        filteredLogs = filteredLogs.filter(log => log.level === query.level);
      }
      
      if (query.action !== undefined) {
        if (query.action === 'null' || query.action === '') {
          filteredLogs = filteredLogs.filter(log => log.action === null);
        } else {
          filteredLogs = filteredLogs.filter(log => log.action === query.action);
        }
      }
      
      if (query.group) {
        filteredLogs = filteredLogs.filter(log => log.group === query.group);
      }
      
      if (query.start_date) {
        const startDate = moment(query.start_date);
        filteredLogs = filteredLogs.filter(log => 
          moment(log.timestamp).isSameOrAfter(startDate)
        );
      }
      
      if (query.end_date) {
        const endDate = moment(query.end_date);
        filteredLogs = filteredLogs.filter(log => 
          moment(log.timestamp).isSameOrBefore(endDate)
        );
      }
      
      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => 
        moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf()
      );
      
      const total = filteredLogs.length;
      const total_pages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      
      return {
        logs: paginatedLogs,
        total,
        page,
        total_pages
      };
      
    } catch (error) {
      console.error('Error retrieving logs:', error);
      throw new Error('Failed to retrieve logs from storage');
    }
  }

  private async getAllSources(): Promise<string[]> {
    const logsDir = this.config.getAppConfig().logs_directory;
    
    try {
      if (!(await fs.pathExists(logsDir))) {
        return [];
      }
      
      const items = await fs.readdir(logsDir);
      const sources: string[] = [];
      
      for (const item of items) {
        const itemPath = path.join(logsDir, item);
        if ((await fs.stat(itemPath)).isDirectory()) {
          sources.push(item);
        }
      }
      
      return sources;
    } catch (error) {
      console.error('Error getting sources:', error);
      return [];
    }
  }

  async getSourcesList(): Promise<string[]> {
    return this.getAllSources();
  }

  async getGroupsList(source?: string): Promise<string[]> {
    const groups = new Set<string>();
    const logsDir = this.config.getAppConfig().logs_directory;
    
    try {
      const sources = source ? [source] : await this.getAllSources();
      
      for (const src of sources) {
        const sourcePath = path.join(logsDir, src);
        if (!(await fs.pathExists(sourcePath))) continue;
        
        const monthYears = await fs.readdir(sourcePath);
        
        for (const monthYear of monthYears) {
          const monthPath = path.join(sourcePath, monthYear);
          if (!(await fs.stat(monthPath)).isDirectory()) continue;
          
          const days = await fs.readdir(monthPath);
          
          for (const day of days) {
            const dayPath = path.join(monthPath, day);
            if (!(await fs.stat(dayPath)).isDirectory()) continue;
            
            const files = await fs.readdir(dayPath);
            
            for (const file of files) {
              if (file.endsWith('.json')) {
                const groupName = file.replace('.json', '');
                groups.add(groupName);
              }
            }
          }
        }
      }
      
      return Array.from(groups).sort();
    } catch (error) {
      console.error('Error getting groups:', error);
      return [];
    }
  }
}
