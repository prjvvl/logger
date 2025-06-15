// TypeScript interfaces and types for the logger system

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  source: string;
  message: string;
  action: null | 'alert';
  group: string;
  position: number;
  details?: Record<string, any>;
}

export interface LogValidationResult {
  valid: boolean;
  error?: string;
}

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
}

export interface AuthTokens {
  [source: string]: string;
}

export interface AppConfig {
  port: number;
  host?: string;
  logs_directory: string;
  max_log_file_size: string;
  log_retention_days: number;
  allowed_sources: string[];
  rate_limit: {
    window_ms: number;
    max_requests: number;
  };
}

export interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
  alert_levels: ('error' | 'warning' | 'info' | 'debug')[];
  rate_limit: {
    max_alerts_per_minute: number;
    cooldown_minutes: number;
  };
}

export interface AlertConfig {
  telegram: TelegramConfig;
}

export interface LogQuery {
  source?: string;
  level?: string;
  action?: string;
  group?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  page?: number;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export interface LogsResponse extends ApiResponse {
  logs?: LogEntry[];
  total?: number;
  page?: number;
  total_pages?: number;
}
