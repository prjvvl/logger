# Environment Configuration Setup Guide

## 🔧 Configuration with .env

Your Logger server now supports environment-based configuration! This is more secure and flexible than config files.

### 📄 Setup Instructions:

1. **Create your .env file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env with your credentials:**
   ```bash
   # Update these values in your .env file
   AUTH_TOKENS={"my_website":"your_secure_token_here","another_app":"another_token"}
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   TELEGRAM_ENABLED=true
   ```

### 🔐 Security Benefits:

- **No sensitive data in git:** .env is excluded from version control
- **Environment-specific configs:** Different .env for dev/staging/production
- **Easy deployment:** Just set environment variables on your server

### 📋 Configuration Priority:

1. **Environment variables** (.env file or system env vars)
2. **Default values** - if no environment variables are found

### 🚀 Available Variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `AUTH_TOKENS` | Bearer tokens (JSON) | See example |
| `TELEGRAM_BOT_TOKEN` | Bot token for alerts | Required for alerts |
| `TELEGRAM_CHAT_ID` | Chat ID for alerts | Required for alerts |
| `TELEGRAM_ENABLED` | Enable Telegram alerts | `false` |
| `LOGS_DIRECTORY` | Log storage path | `./logs` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### 🔄 Migration from Config Files:

Your existing config files will still work as fallbacks, but .env takes priority.

### 🧪 Testing:

```bash
# Test with different port
PORT=3001 npm run dev

# Test with custom tokens
AUTH_TOKENS='{"test":"newtoken123"}' npm start
```
