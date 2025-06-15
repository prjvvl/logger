// Example client usage for the Logger API
// This shows how to integrate the logger into your applications

class LoggerClient {
  constructor(baseUrl, bearerToken, source) {
    this.baseUrl = baseUrl;
    this.bearerToken = bearerToken;
    this.source = source;
  }

  async sendLog(level, message, details = {}, options = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      source: this.source,
      level: level,
      message: message,
      details: details,
      action: options.alert ? 'alert' : null,
      group: options.group || 'general',
      position: options.position || 1
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to send log:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Error sending log:', error);
      return { success: false, error: error.message };
    }
  }

  // Convenience methods for different log levels
  async info(message, details, options) {
    return this.sendLog('info', message, details, options);
  }

  async warning(message, details, options) {
    return this.sendLog('warning', message, details, options);
  }

  async error(message, details, options) {
    return this.sendLog('error', message, details, { ...options, alert: true });
  }

  async debug(message, details, options) {
    return this.sendLog('debug', message, details, options);
  }
}

// Example usage:
async function exampleUsage() {
  // Initialize logger client
  const logger = new LoggerClient(
    'http://localhost:3000',  // Logger server URL
    'test123token456',        // Your Bearer token
    'my_website'              // Your source identifier
  );

  // Log user actions
  await logger.info('User logged in', {
    user_id: 'user123',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0...'
  }, {
    group: 'authentication',
    position: 1
  });

  // Log warnings
  await logger.warning('Slow database query detected', {
    query_time: 2.5,
    query: 'SELECT * FROM users WHERE...',
    table: 'users'
  }, {
    group: 'performance',
    position: 2
  });

  // Log errors (automatically sends alerts)
  await logger.error('Payment processing failed', {
    error_code: 'PAYMENT_001',
    user_id: 'user123',
    amount: 99.99,
    currency: 'USD',
    gateway_response: 'Card declined'
  }, {
    group: 'payments',
    position: 3
  });

  // Log debug information
  await logger.debug('Cache miss for user profile', {
    user_id: 'user123',
    cache_key: 'profile:user123',
    fetch_time: 0.15
  }, {
    group: 'caching',
    position: 4
  });
}

// For Node.js environments, uncomment the line below to run the example:
// exampleUsage().catch(console.error);

// For browser environments, you can use this logger directly
if (typeof window !== 'undefined') {
  window.LoggerClient = LoggerClient;
}

module.exports = LoggerClient;
