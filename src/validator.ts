import { LogEntry, LogValidationResult, AuthValidationResult } from './types';

export class LogValidator {
  private static readonly REQUIRED_FIELDS = ['timestamp', 'level', 'source', 'message', 'group', 'position'];
  private static readonly VALID_LEVELS = ['error', 'warning', 'info', 'debug'] as const;

  static validateBearerToken(authHeader: string | undefined): AuthValidationResult {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { 
        valid: false, 
        error: 'Missing or invalid Authorization header. Expected format: "Bearer <token>"' 
      };
    }

    const token = authHeader.substring(7);
    if (!token.trim()) {
      return { 
        valid: false, 
        error: 'Empty bearer token provided' 
      };
    }

    return { valid: true };
  }

  static extractBearerToken(authHeader: string): string {
    return authHeader.substring(7).trim();
  }

  static validateLog(log: any): LogValidationResult {
    // Check if log is an object
    if (!log || typeof log !== 'object') {
      return { valid: false, error: 'Log must be a valid object' };
    }

    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      if (log[field] === undefined || log[field] === null) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    // Validate level
    if (!this.VALID_LEVELS.includes(log.level)) {
      return { 
        valid: false, 
        error: `Invalid level: ${log.level}. Must be one of: ${this.VALID_LEVELS.join(', ')}` 
      };
    }

    // Validate action (can be null or "alert")
    if (log.action !== null && log.action !== undefined && log.action !== 'alert') {
      return { 
        valid: false, 
        error: `Invalid action: ${log.action}. Must be null or "alert"` 
      };
    }

    // Validate position is a positive number
    if (typeof log.position !== 'number' || log.position < 1 || !Number.isInteger(log.position)) {
      return { 
        valid: false, 
        error: 'Position must be a positive integer >= 1' 
      };
    }

    // Validate timestamp format (basic ISO 8601 check)
    if (typeof log.timestamp !== 'string') {
      return { 
        valid: false, 
        error: 'Timestamp must be a string in ISO 8601 format' 
      };
    }

    const date = new Date(log.timestamp);
    if (isNaN(date.getTime())) {
      return { 
        valid: false, 
        error: 'Invalid timestamp format. Use ISO 8601 format (e.g., 2025-06-15T10:30:00.000Z)' 
      };
    }

    // Validate source is non-empty string
    if (typeof log.source !== 'string' || !log.source.trim()) {
      return { 
        valid: false, 
        error: 'Source must be a non-empty string' 
      };
    }

    // Validate message is non-empty string
    if (typeof log.message !== 'string' || !log.message.trim()) {
      return { 
        valid: false, 
        error: 'Message must be a non-empty string' 
      };
    }

    // Validate group is non-empty string
    if (typeof log.group !== 'string' || !log.group.trim()) {
      return { 
        valid: false, 
        error: 'Group must be a non-empty string' 
      };
    }

    // Validate details if provided
    if (log.details !== undefined && log.details !== null) {
      if (typeof log.details !== 'object' || Array.isArray(log.details)) {
        return { 
          valid: false, 
          error: 'Details must be an object if provided' 
        };
      }
    }

    return { valid: true };
  }

  static sanitizeLog(log: any): LogEntry {
    return {
      timestamp: log.timestamp,
      level: log.level,
      source: log.source.trim(),
      message: log.message.trim(),
      action: log.action === null || log.action === undefined ? null : 'alert',
      group: log.group.trim(),
      position: log.position,
      details: log.details || {}
    };
  }
}
