# Quick Start Guide

## ⚡ Getting Started in 2 Minutes

1. **Clone and setup:**
   ```bash
   cd c:\PRJWL\dev\crafts\logger
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

3. **Build and start:**
   ```bash
   npm run build
   npm run dev
   ```

4. **Access dashboard:**
   Open http://localhost:3000 in your browser

## 🧪 Testing the System

Run the test script to verify everything works:
```bash
node test-api.js
```

## ⚙️ Configuration Options

All configuration is done via environment variables in the `.env` file:

- **Authentication tokens:** Set `AUTH_TOKENS` in `.env`
- **Server settings:** Set `PORT` and `LOGS_DIRECTORY` in `.env`  
- **Telegram alerts:** Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ENABLED` in `.env`

## 📊 Log Format

```json
{
  "timestamp": "2025-06-15T10:30:00.000Z",
  "source": "my_website",
  "level": "info",
  "message": "User logged in successfully",
  "details": {
    "user_id": "user123",
    "ip_address": "192.168.1.100"
  },
  "action": null,
  "group": "authentication",
  "position": 1
}
```

## 🔐 Authentication

Include Bearer token in your requests:
```
Authorization: Bearer your_token_here
```

## 📱 Client Integration

See `example-client.js` for integration examples.

## 🎯 API Endpoints

- `POST /api/logs` - Submit logs
- `GET /api/logs` - Retrieve logs
- `GET /api/sources` - List sources
- `GET /api/groups` - List groups
- `GET /health` - Health check

## 🚨 Alerts

Set `action: "alert"` to trigger Telegram notifications (requires bot configuration).

## 📁 Log Storage

Logs are stored in: `logs/website/month-year/date/group.json`

---

For complete documentation, see `DOCUMENTATION.md` and `API_REFERENCE.md`.
