# Logger Website - Development Implementation Guide

## Quick Start Development Steps

### Phase 1: Basic Setup (2-3 hours)

#### Step 1.1: Project Initialization (15 minutes)
```cmd
cd c:\PRJWL\dev\crafts\logger
npm init -y
npm install express body-parser fs-extra cors moment
npm install --save-dev nodemon
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

#### Step 1.2: Create Authentication System (20 minutes)
Create `config/auth_tokens.json`:
```json
{
  "website1": "abc123xyz789",
  "website2": "def456uvw012",
  "test_site": "test123token456"
}
```

#### Step 1.3: Create Basic Server (45 minutes)
Create `server.js` with:
- Express server setup
- POST /api/logs endpoint with authentication
- Updated log validation for new fields
- New file system storage structure

#### Step 1.4: Test Log Reception (15 minutes)
Test with curl or Postman:
```cmd
curl -X POST http://localhost:3000/api/logs ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer test123token456" ^
  -d "{\"timestamp\":\"2025-06-15T10:30:00.000Z\",\"level\":\"error\",\"source\":\"test_site\",\"message\":\"Test log message\",\"action\":\"alert\",\"group\":\"test_group\",\"position\":1,\"details\":{\"test\":true}}"
```

#### Step 1.5: Directory Structure Creation (30 minutes)
Implement automatic folder creation:
- logs/[source]/[MM-YYYY]/[DD]/
- Group-based file naming
- JSON file storage per group per day

### Phase 2: Web Interface (3-4 hours)

#### Step 2.1: Basic HTML Structure (45 minutes)
Create `public/index.html`:
- Header with title
- Filter section (source, level, action, group, date)
- Log display area with group visualization
- Pagination controls

#### Step 2.2: CSS Styling (30 minutes)
Create `public/style.css`:
- Clean, modern design
- Responsive layout
- Log entry styling with group indicators
- Filter controls styling
- Alert log highlighting

#### Step 2.3: JavaScript Functionality (2.5 hours)
Create `public/script.js`:
- Fetch logs from API with authentication
- Apply filters including group and action
- Display logs grouped and sorted by position
- Pagination logic
- Group-based log organization

#### Step 2.4: GET API Endpoint (1 hour)
Add GET /api/logs endpoint:
- Read log files from new structure
- Apply filters including group and action
- Sort by position within groups
- Return paginated results

### Phase 3: Enhanced Features (2-3 hours)

#### Step 3.1: Advanced Filtering (1.5 hours)
- Date range picker
- Search in message content and groups
- Multiple source selection
- Log level and action checkboxes
- Group-based filtering and sorting

#### Step 3.2: Real-time Updates (45 minutes)
- Auto-refresh functionality
- New log notifications
- Alert log highlighting
- WebSocket implementation (optional)

#### Step 3.3: Export Functionality (45 minutes)
- Export filtered logs as JSON
- Export as CSV format with group organization
- Download functionality
- Group-based export options

#### Step 3.4: Performance Optimization (30 minutes)
- File caching
- Lazy loading
- Search indexing

#### Step 3.5: Alert System Foundation (45 minutes)
- Telegram bot configuration setup
- Alert notification structure
- Webhook preparation for future alert channels

### Phase 4: Production Ready (2-3 hours)

#### Step 4.1: Configuration Management (1 hour)
Create `config/config.json`:
- Port settings
- File paths
- Retention policies
- Rate limiting per token

Create `config/auth_tokens.json`:
- Website authentication tokens
- Token management system

Create `config/alerts.json`:
- Telegram bot configuration
- Alert channel settings
- Notification preferences

#### Step 4.2: Log Rotation (45 minutes)
- Daily file rotation with new structure
- Old file cleanup
- Group-based file management
- Size-based rotation

#### Step 4.3: Error Handling (30 minutes)
- Proper error responses
- Authentication validation messages
- Graceful failures
- Token verification errors

## Detailed Implementation

### Server.js Implementation Pattern

```javascript
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 3000;
const LOGS_DIR = './logs';
const AUTH_TOKENS_FILE = './config/auth_tokens.json';

// Load authentication tokens
let authTokens = {};
try {
  authTokens = require(AUTH_TOKENS_FILE);
} catch (error) {
  console.log('No auth tokens file found, creating default...');
  authTokens = { "test_site": "test123token456" };
  fs.ensureFileSync(AUTH_TOKENS_FILE);
  fs.writeJsonSync(AUTH_TOKENS_FILE, authTokens);
}

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// Validate authentication token from header
function validateBearerToken(authHeader, source) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing or invalid Authorization header' };
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (authTokens[source] !== token) {
    return { valid: false, error: 'Invalid authorization token' };
  }
  
  return { valid: true };
}

// Validate log entry
function validateLog(log) {
  const required = ['timestamp', 'level', 'source', 'message', 'group', 'position'];
  const validLevels = ['error', 'warning', 'info', 'debug'];
  
  // Check required fields
  for (const field of required) {
    if (log[field] === undefined || log[field] === null) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  
  // Validate level
  if (!validLevels.includes(log.level)) {
    return { valid: false, error: `Invalid level: ${log.level}` };
  }
  
  // Validate action (can be null or "alert")
  if (log.action !== null && log.action !== undefined && log.action !== 'alert') {
    return { valid: false, error: `Invalid action: ${log.action}. Must be null or "alert"` };
  }
  
  // Validate position is a number
  if (typeof log.position !== 'number' || log.position < 1) {
    return { valid: false, error: `Position must be a number >= 1` };
  }
  
  return { valid: true };
}

// Save log to file
async function saveLog(log) {
  const date = moment(log.timestamp);
  const monthYear = date.format('MM-YYYY');
  const day = date.format('DD');
  
  const logDir = path.join(LOGS_DIR, log.source, monthYear, day);
  const logFile = path.join(logDir, `${log.group}.json`);
  
  // Ensure directory exists
  await fs.ensureDir(logDir);
  
  // Read existing logs for this group
  let logs = [];
  try {
    if (await fs.pathExists(logFile)) {
      const fileContent = await fs.readFile(logFile, 'utf8');
      logs = fileContent.trim().split('\n').map(line => JSON.parse(line));
    }
  } catch (error) {
    console.log('Creating new log file for group:', log.group);
  }
  
  // Add new log
  logs.push(log);
  
  // Sort by position
  logs.sort((a, b) => a.position - b.position);
  
  // Write back to file
  const content = logs.map(l => JSON.stringify(l)).join('\n') + '\n';
  await fs.writeFile(logFile, content);
}

// API Routes
app.post('/api/logs', async (req, res) => {
  try {
    // Validate authentication token from header
    const authValidation = validateBearerToken(req.headers.authorization, req.body.source);
    if (!authValidation.valid) {
      return res.status(401).json({ success: false, error: authValidation.error });
    }
    
    // Validate log data
    const validation = validateLog(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    
    await saveLog(req.body);
    res.json({ success: true, message: 'Log saved successfully' });
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).json({ success: false, error: 'Failed to save log' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    // Validate authentication token from header
    const authValidation = validateBearerToken(req.headers.authorization, req.query.source);
    if (!authValidation.valid) {
      return res.status(401).json({ success: false, error: authValidation.error });
    }
    
    // Implementation for retrieving logs with new filtering options
    // ... (rest of the implementation)
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve logs' });
  }
});

app.listen(PORT, () => {
  console.log(`Logger server running on port ${PORT}`);
});
```

### Frontend Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logger Dashboard</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Log Viewer Dashboard</h1>
        </header>
        
        <div class="filters">
            <div class="filter-group">
                <label>Source:</label>
                <select id="sourceFilter">
                    <option value="">All Sources</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Level:</label>
                <select id="levelFilter">
                    <option value="">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                </select>
            </div>
            
            <div class="filter-group">
                <label>Date From:</label>
                <input type="date" id="dateFrom">
            </div>
            
            <div class="filter-group">
                <label>Date To:</label>
                <input type="date" id="dateTo">
            </div>
            
            <button id="filterBtn">Filter</button>
            <button id="exportBtn">Export</button>
        </div>
        
        <div class="logs-container">
            <div id="logs"></div>
            <div class="pagination">
                <button id="prevBtn">Previous</button>
                <span id="pageInfo">Page 1 of 1</span>
                <button id="nextBtn">Next</button>
            </div>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>
```

## Testing Strategy

### Unit Tests
1. Log validation function
2. File storage function
3. Log retrieval function
4. Filter application

### Integration Tests
1. API endpoint functionality
2. File system operations
3. Frontend-backend communication

### Manual Testing Checklist
- [ ] Log reception works
- [ ] Files created in correct structure
- [ ] Web interface loads
- [ ] Filters work correctly
- [ ] Pagination functions
- [ ] Export functionality
- [ ] Error handling

## Deployment Checklist

### Before Deployment
- [ ] Environment variables configured
- [ ] Log directory permissions set
- [ ] Port accessibility confirmed
- [ ] Error handling tested
- [ ] Log rotation implemented

### Production Setup
- [ ] Reverse proxy configured (nginx/apache)
- [ ] SSL certificate installed
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Log retention policy active

## Time Estimates

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Project setup, auth & updated API | 3-4 hours |
| 2 | Web interface with group support | 4-5 hours |
| 3 | Enhanced features & group filtering | 4-5 hours |
| 4 | Production preparation & alert setup | 2-3 hours |
| **Total** | | **13-17 hours** |

## Next Steps After Development

1. Deploy to your remote server
2. Update other applications to send logs
3. Configure log retention policies
4. Set up monitoring alerts
5. Create backup procedures

This implementation keeps it simple while providing all necessary functionality for your personal logging needs.
