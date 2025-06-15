# Logger API Reference

## Quick Reference for Integration

### Sending Logs to Logger

**Endpoint:** `POST /api/logs`  
**Content-Type:** `application/json`

### Standard Log Format

```json
{
  "timestamp": "2025-06-15T10:30:00.000Z",
  "level": "error",
  "source": "my_website",
  "message": "Error description",
  "action": "alert",
  "group": "payment_processing",
  "position": 1,
  "details": {
    "url": "/api/endpoint",
    "user_id": "12345",
    "additional_info": "any extra data"
  }
}
```

### Required Headers
```
Authorization: Bearer your_auth_token_here
Content-Type: application/json
```

### Integration Examples

#### JavaScript/Node.js
```javascript
const sendLog = async (level, message, group, position, action = null, details = {}) => {
    const logData = {
        timestamp: new Date().toISOString(),
        level: level,
        source: 'my_app_name',
        message: message,
        action: action,
        group: group,
        position: position,
        details: details
    };
    
    try {
        const response = await fetch('http://your-logger-server.com/api/logs', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer your_auth_token_here'
            },
            body: JSON.stringify(logData)
        });
        
        if (!response.ok) {
            console.error('Failed to send log:', await response.text());
        }
    } catch (error) {
        console.error('Failed to send log:', error);
    }
};

// Usage
sendLog('error', 'Database connection failed', 'db_operations', 1, 'alert', {
    url: '/api/users',
    error_code: 'DB_TIMEOUT'
});

sendLog('info', 'User login successful', 'user_auth', 2, null, {
    user_id: '12345',
    ip: '192.168.1.1'
});
```

#### PHP
```php
function sendLog($level, $message, $group, $position, $action = null, $details = [], $authToken = 'your_auth_token_here') {
    $logData = [
        'timestamp' => date('c'),
        'level' => $level,
        'source' => 'my_php_app',
        'message' => $message,
        'action' => $action,
        'group' => $group,
        'position' => $position,
        'details' => $details
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n" .
                       "Authorization: Bearer " . $authToken . "\r\n",
            'method' => 'POST',
            'content' => json_encode($logData)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents('http://your-logger-server.com/api/logs', false, $context);
    
    if ($result === FALSE) {
        error_log('Failed to send log to logger server');
    }
}

// Usage
sendLog('error', 'Payment processing failed', 'payments', 1, 'alert', [
    'order_id' => '12345',
    'amount' => 99.99,
    'gateway' => 'stripe'
]);

sendLog('info', 'Order completed', 'orders', 3, null, [
    'order_id' => '12345',
    'customer_id' => '67890'
]);
```

#### Python
```python
import requests
import json
from datetime import datetime

def send_log(level, message, group, position, action=None, details=None, auth_token='your_auth_token_here'):
    if details is None:
        details = {}
        
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'level': level,
        'source': 'my_python_app',
        'message': message,
        'action': action,
        'group': group,
        'position': position,
        'details': details
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }
    
    try:
        response = requests.post(
            'http://your-logger-server.com/api/logs',
            json=log_data,
            headers=headers,
            timeout=5
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to send log: {e}")
        return False

# Usage
send_log('info', 'User login successful', 'authentication', 1, None, {
    'user_id': '12345',
    'ip_address': '192.168.1.1',
    'login_method': 'password'
})

send_log('error', 'Database connection timeout', 'database', 1, 'alert', {
    'database': 'users',
    'timeout_duration': 30,
    'retry_count': 3
})
```

### Log Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `error` | System errors, exceptions | Failed operations, crashes |
| `warning` | Potential issues | Deprecated functions, timeouts |
| `info` | General information | User actions, system events |
| `debug` | Development information | Variable values, flow tracking |

### Action Types

| Action | Description | Use Case |
|--------|-------------|----------|
| `null` | Standard logging | Regular application logs |
| `"alert"` | Alert triggering | Critical issues requiring immediate attention |

### Required Fields

- **timestamp**: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **level**: One of: `error`, `warning`, `info`, `debug`
- **source**: Identifier for your application/website
- **message**: Human-readable description
- **group**: Group name for organizing related logs
- **position**: Number for ordering logs within a group

### Required Headers

- **Authorization**: Bearer token (`Bearer your_token_here`)
- **Content-Type**: `application/json`
- **level**: One of: `error`, `warning`, `info`, `debug`
- **source**: Identifier for your application/website
- **message**: Human-readable description
- **action**: One of: `log`, `alert`
- **group**: Group name for organizing related logs
- **position**: Number for ordering logs within a group (starts from 1)
- **auth_token**: Authentication token for your website

### Optional Details Fields

Common details fields you might include:

```json
{
  "details": {
    "url": "/current/page/url",
    "user_id": "user_identifier",
    "session_id": "session_identifier",
    "ip_address": "client_ip",
    "user_agent": "browser_info",
    "request_id": "unique_request_id",
    "error_code": "application_error_code",
    "stack_trace": "error_stack_trace",
    "custom_field": "any_additional_data",
    "correlation_id": "for_linking_related_logs"
  }
}
```

### File Structure on Server

Your logs will be stored as:
```
logs/
├── my_website/
│   ├── 06-2025/
│   │   ├── 15/
│   │   │   ├── user_authentication.json
│   │   │   ├── payment_processing.json
│   │   │   └── database_operations.json
│   │   └── 16/
│   │       └── api_calls.json
│   └── 07-2025/
└── my_other_app/
    └── 06-2025/
        └── 15/
            └── error_handling.json
```

Each JSON file contains logs for a specific group on a specific date, sorted by position.

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Log saved successfully"
}
```

**Error Response (Invalid Token):**
```json
{
  "success": false,
  "error": "Invalid authentication token"
}
```

**Error Response (Missing Fields):**
```json
{
  "success": false,
  "error": "Missing required field: group"
}
```

### Rate Limiting

To prevent spam, consider implementing rate limiting in your applications:

```javascript
// Simple rate limiting example
let lastLogTime = 0;
const LOG_INTERVAL = 1000; // 1 second minimum between logs

const sendLogWithRateLimit = (level, message, context) => {
    const now = Date.now();
    if (now - lastLogTime >= LOG_INTERVAL) {
        lastLogTime = now;
        sendLog(level, message, context);
    }
};
```

### Best Practices

1. **Use meaningful source names**: Use consistent naming for your applications
2. **Use descriptive group names**: Group related logs together (e.g., 'user_auth', 'payment_flow', 'api_errors')
3. **Set proper positions**: Use sequential numbers within each group for proper ordering
4. **Use appropriate actions**: Use 'alert' for critical issues that need immediate attention (will trigger Telegram notifications)
5. **Include relevant details**: Add context information that helps with debugging
6. **Don't log sensitive data**: Avoid passwords, tokens, personal information in details field
7. **Use appropriate levels**: Don't use 'error' for warnings or info messages
8. **Include timestamps**: Always use ISO 8601 format for consistency
9. **Handle failures gracefully**: Don't let logging failures break your app
10. **Secure your tokens**: Keep authentication tokens secret and rotate them regularly

### Group Organization Tips

- **user_auth**: Login, logout, registration logs
- **payment_processing**: Payment flow logs
- **api_errors**: API-related errors
- **database_operations**: Database query logs
- **security_events**: Security-related logs (use action: 'alert')
- **performance**: Performance monitoring logs

### Testing Your Integration

Use curl to test your integration:

```cmd
curl -X POST http://localhost:3000/api/logs ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer your_test_token" ^
  -d "{\"timestamp\":\"2025-06-15T10:30:00.000Z\",\"level\":\"info\",\"source\":\"test_app\",\"message\":\"Testing log integration\",\"action\":\"alert\",\"group\":\"integration_test\",\"position\":1,\"details\":{\"test\":true}}"
```

### Error Handling in Your Apps

Always handle logging failures gracefully:

```javascript
const safeLog = async (level, message, group, position, action = null, details = {}) => {
    try {
        await sendLog(level, message, group, position, action, details);
    } catch (error) {
        // Don't break your app if logging fails
        console.error('Logging failed:', error);
        // Optionally store locally for retry
        localStorage.setItem('failed_log', JSON.stringify({
            level, message, group, position, action, details, timestamp: new Date().toISOString()
        }));
    }
};
```

### Authentication Token Management

Store your authentication tokens securely:

```javascript
// Environment variables (recommended)
const AUTH_TOKEN = process.env.LOGGER_AUTH_TOKEN;

// Or in a secure config file
const config = {
    logger: {
        url: 'http://your-logger-server.com/api/logs',
        token: 'your_secure_token_here'
    }
};

// Usage with proper headers
const sendLogWithAuth = async (logData) => {
    return fetch(config.logger.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.logger.token}`
        },
        body: JSON.stringify(logData)
    });
};
```

This reference should help you quickly integrate the updated logger into your existing applications!
