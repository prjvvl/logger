# Logger

A simple centralized logging system with a clean dark web interface.

## Quick Start

```bash
# Setup
npm install
cp .env.example .env
# Edit .env with your tokens

# Run
npm run build
npm run dev
# Open http://localhost:3000
```

## Features

- **Centralized logging** from multiple apps
- **Dark web dashboard** with time filters  
- **Bearer token authentication**
- **Telegram alerts** (optional)
- **Environment-based config**

## Configuration

Edit `.env`:
```env
PORT=3000
AUTH_TOKENS={"my_app":"your_token"}
TELEGRAM_BOT_TOKEN=bot_token
TELEGRAM_ENABLED=false
```

## API Usage

```bash
# Submit log
curl -X POST http://localhost:3000/api/logs \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"timestamp":"2025-06-15T10:30:00.000Z","source":"my_app","level":"info","message":"Test","group":"test","position":1}'
```

## Log Format

```json
{
  "timestamp": "2025-06-15T10:30:00.000Z",
  "source": "my_app",
  "level": "info|warning|error|debug", 
  "message": "Log message",
  "group": "category_name",
  "position": 1,
  "action": null,
  "details": {}
}
```

## Documentation

- **[Complete Documentation](docs/DOCUMENTATION.md)** - Full details
- **[API Reference](docs/API_REFERENCE.md)** - API docs
- **[Quick Start Guide](docs/QUICK_START.md)** - Setup help

## Scripts

```bash
npm run dev     # Development
npm run build   # Production build
npm start       # Start production
node test-api.js # Test API
```
