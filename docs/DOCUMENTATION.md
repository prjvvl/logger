# Logger - Detailed Documentation

A modern TypeScript-based centralized logging system for collecting and viewing logs from multiple applications.

## Overview

This project provides a complete logging solution that:
- **Receives logs** from multiple applications via a secure API endpoint
- **Stores logs** in organized hierarchical folder structures  
- **Provides a modern web dashboard** with dark theme and Material Icons
- **Supports real-time filtering** with time range presets
- **Includes Telegram alerts** for critical logs
- **Uses TypeScript** for better code quality and maintainability

## Updated Project Structure

```
logger/
├── src/                        # TypeScript source code
│   ├── config.ts              # Configuration management
│   ├── server.ts              # Express server with routes
│   ├── storage.ts             # Log storage logic
│   ├── validator.ts           # Input validation
│   ├── alerts.ts              # Alert system (Telegram)
│   └── types.ts               # Type definitions
├── public/                     # Web dashboard
│   ├── index.html             # Main dashboard page
│   ├── style-simple.css       # Clean dark theme
│   └── script.js              # Dashboard functionality
├── scripts/                    # Build and development scripts
│   ├── build.js               # Production build script
│   └── dev.js                 # Development server script
├── docs/                       # Documentation
│   ├── DOCUMENTATION.md       # This file
│   ├── API_REFERENCE.md       # API documentation
│   ├── QUICK_START.md         # Quick setup guide
│   └── IMPLEMENTATION.md      # Development details
├── examples/                   # Usage examples
│   └── example-client.js      # Client integration example
├── logs/                       # Log storage (auto-created)
│   ├── website1/
│   │   ├── 06-2025/
│   │   │   ├── 15/
│   │   │   │   ├── user_registration.json
│   │   │   │   ├── payment_process.json
│   │   │   │   └── error_group.json
│   │   │   └── 16/
│   │   └── 07-2025/
│   └── website2/
├── dist/                       # Compiled output (auto-generated)
├── .env                        # Environment variables
├── .env.example               # Environment template
├── package.json               # Project configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Quick overview
```

## Log Format Standard

All logs must follow this JSON structure:

```json
{
  "timestamp": "2025-06-15T10:30:00.000Z",
  "level": "error|warning|info|debug",
  "source": "website_name",
  "message": "Log message description",
  "action": null,
  "group": "group_name",
  "position": 1,
  "details": {
    "url": "https://example.com/page",
    "user_id": "12345",
    "ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "additional_data": "any extra information"
  }
}
```

### Required Headers
- `Authorization`: Bearer token for authentication (e.g., `Bearer abc123xyz789`)

### Required Fields
- `timestamp`: ISO 8601 format timestamp
- `level`: One of: error, warning, info, debug
- `source`: Name of the website/application sending the log
- `message`: Descriptive log message
- `group`: Group name for clubbing related logs together
- `position`: Number indicating position within the group for sorting

### Optional Fields
- `action`: Can be null or "alert" (alert will trigger alerts in future)
- `details`: Object containing additional contextual information

## API Endpoints

### POST /api/logs
Receives logs from external applications.

**Headers:**
```
Authorization: Bearer abc123xyz789
Content-Type: application/json
```

**Request:**
```json
{
  "timestamp": "2025-06-15T10:30:00.000Z",
  "level": "error",
  "source": "my_website",
  "message": "Database connection failed",
  "action": "alert",
  "group": "database_operations",
  "position": 1,
  "details": {
    "url": "/api/users",
    "error_code": "DB_CONNECTION_TIMEOUT"
  }
}
```

**Response:**
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
  "error": "Invalid or missing authorization token"
}
```

### GET /api/logs
Retrieve logs with filtering options.

**Headers:**
```
Authorization: Bearer your_auth_token
```

**Query Parameters:**
- `source`: Filter by website name
- `level`: Filter by log level
- `action`: Filter by action type (null, alert)
- `group`: Filter by group name
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `limit`: Number of logs to return (default: 100)
- `page`: Page number for pagination

## Development Phases

### Phase 1: Basic Setup (Day 1)
**Objective:** Create basic project structure and log receiving functionality

**Tasks:**
1. Initialize Node.js project
2. Install dependencies (Express, body-parser, fs-extra)
3. Create basic server with POST endpoint
4. Implement authentication token validation
5. Implement log storage in new file system structure
6. Test log receiving functionality with authentication

**Deliverables:**
- Working API endpoint that receives and stores logs
- Authentication token validation system
- New folder structure creation (website/month-year/date/group.json)
- Simple validation for updated log format

### Phase 2: Web Interface (Day 2)
**Objective:** Create web interface for viewing logs

**Tasks:**
1. Create HTML interface with updated filtering options
2. Add CSS for basic styling
3. Implement JavaScript for API communication with auth tokens
4. Create log display functionality with group sorting
5. Add pagination support

**Deliverables:**
- Web interface accessible at root URL
- Basic filtering by source, level, action, and group
- Paginated log display with group-based sorting
- Authentication token management interface

### Phase 3: Enhanced Filtering (Day 3)
**Objective:** Add advanced filtering and search capabilities

**Tasks:**
1. Implement date range filtering
2. Add search functionality for log messages and groups
3. Create export functionality (JSON/CSV)
4. Add real-time log updates
5. Improve UI/UX with group visualization
6. Add alert log highlighting

**Deliverables:**
- Advanced filtering options including group and action filters
- Search functionality across messages and groups
- Export capabilities with group organization
- Auto-refresh for new logs
- Visual distinction for alert logs

### Phase 4: Production Deployment (Day 4)
**Objective:** Prepare for production deployment

**Tasks:**
1. Add configuration management
2. Implement log rotation/cleanup for new structure
3. Add authentication token management system
4. Performance optimization for group-based queries
5. Documentation completion

**Deliverables:**
- Production-ready configuration
- Log management features with new folder structure
- Authentication token management
- Deployment guide with security considerations

## Development Steps

### Step 1: Project Initialization

```bash
# Navigate to project directory
cd c:\PRJWL\dev\crafts\logger

# Initialize package.json
npm init -y

# Install dependencies
npm install express body-parser fs-extra cors moment
npm install --save-dev nodemon
```

### Step 2: Create Basic Server

Create `server.js`:
```javascript
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Log storage endpoint
app.post('/api/logs', async (req, res) => {
  // Implementation here
});

// Log retrieval endpoint
app.get('/api/logs', async (req, res) => {
  // Implementation here
});

app.listen(PORT, () => {
  console.log(`Logger server running on port ${PORT}`);
});
```

### Step 3: Create Web Interface

Create `public/index.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Logger Dashboard</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Log Viewer</h1>
    <div class="filters">
      <!-- Filter controls -->
    </div>
    <div class="logs-container">
      <!-- Log display area -->
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>
```

### Step 4: Directory Structure

The system will automatically create directories:
```
logs/
├── [source_name]/
│   ├── error/
│   ├── warning/
│   ├── info/
│   └── debug/
```

### Step 5: Configuration

Create `.env` file (copy from `.env.example`):
```env
PORT=3000
LOGS_DIRECTORY=./logs
AUTH_TOKENS={"website1":"abc123xyz789","website2":"def456uvw012","my_ecommerce":"ghi789rst345"}
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
```

All configuration is now environment-based. No config files needed!

## File Naming Convention

Log files will be named using the pattern:
```
logs/[source]/[MM-YYYY]/[DD]/[group_name].json
```

Example:
```
logs/my_website/06-2025/15/user_registration.json
logs/my_website/06-2025/15/payment_processing.json
logs/ecommerce_site/06-2025/16/api_errors.json
```

Each file contains logs for a specific group on a specific date, sorted by position field.

## Usage Examples

### Sending Logs from External Application

```javascript
// From your other websites/apps
const logData = {
  timestamp: new Date().toISOString(),
  level: 'error',
  source: 'my_ecommerce_site',
  message: 'Payment gateway timeout',  action: 'alert',
  group: 'payment_processing',
  position: 1,
  details: {
    url: '/checkout/payment',
    user_id: '12345',
    order_id: 'ORD-789',
    amount: 99.99
  }
};

fetch('http://your-logger-server.com/api/logs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_website_auth_token'
  },
  body: JSON.stringify(logData)
});
```

### Viewing Logs

1. Open web browser
2. Navigate to `http://your-logger-server.com`
3. Use filters to find specific logs
4. Export logs if needed

## Security Considerations

- Authentication tokens required for all log submissions
- Implement rate limiting for the log endpoint per token
- Validate log data to prevent injection attacks
- Regular cleanup of old log files
- Secure storage of authentication tokens
- Consider IP whitelisting for additional security

## Performance Notes

- Log files are organized by date and group to improve search performance
- Group-based organization allows for efficient log clustering
- Position field enables proper log sequence ordering within groups
- Consider implementing log rotation for large volumes
- Monitor disk space usage with new deeper folder structure
- Index frequently searched fields if using database in future
- Alert logs can be processed separately for faster notifications

## Future Enhancements

- Database storage option (MongoDB/PostgreSQL)
- Real-time dashboard with WebSocket
- Alert system implementation for action: "alert" logs
- Email/SMS notifications for alert logs
- Telegram notifications for critical alerts
- Log aggregation and statistics by groups
- Multi-user support with role-based access
- Advanced group analytics and visualization
- Log correlation across different groups
- Alert channel configuration (Email, Telegram, SMS)

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in config or kill existing process
2. **Permission denied**: Ensure write permissions for logs directory
3. **Large log files**: Implement log rotation
4. **Memory issues**: Consider streaming for large file reads

### Log File Corruption

If log files become corrupted:
1. Check disk space
2. Verify file permissions
3. Restart the service
4. Backup and recreate corrupted files

---

**Note:** This is a simple implementation for personal use. For production environments with high traffic, consider using dedicated logging solutions like ELK stack or cloud-based services.

## Alert System

### Overview
Logs with `action: "alert"` will trigger notifications through configured alert channels.

### Telegram Alerts
One of the primary alert channels will be Telegram notifications for critical issues.

#### Configuration
Configure Telegram alerts in your `.env` file:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
TELEGRAM_ENABLED=true
```

#### Alert Message Format
Telegram alerts will include:
- **Source**: Website/application name
- **Level**: Log level (error, warning, etc.)
- **Message**: Log message
- **Group**: Log group name
- **Timestamp**: When the log occurred
- **Details**: Relevant context information

#### Sample Alert Message
```
🚨 ALERT - my_website
Level: error
Group: payment_processing
Message: Payment gateway timeout

Details:
- URL: /checkout/payment
- Order ID: ORD-789
- Amount: $99.99

Time: 2025-06-15 10:30:00 UTC
```

### Alert Features
- **Rate limiting**: Prevents spam by limiting alerts per minute
- **Cooldown period**: Reduces duplicate alerts for the same issue
- **Level filtering**: Only send alerts for specified log levels
- **Rich formatting**: Clear, structured alert messages
- **Immediate delivery**: Real-time notifications for critical issues
