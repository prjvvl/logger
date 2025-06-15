# Deployment Guide

This guide covers deploying the Logger server for public access.

## Network Configuration

### Local Development
By default, the server binds to `127.0.0.1` (localhost) for security:
```bash
# Default - only accessible locally
npm run dev
```

### Public Deployment
To make the server publicly accessible, set the `HOST` environment variable to `0.0.0.0`:

```bash
# Windows
set HOST=0.0.0.0
npm start

# Linux/Mac
HOST=0.0.0.0 npm start
```

Or create a `.env` file:
```env
HOST=0.0.0.0
PORT=3000
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `127.0.0.1` | Server bind address. Use `0.0.0.0` for public access |
| `PORT` | `3000` | Server port |

## Security Considerations

### Firewall Configuration
Ensure your server's firewall allows inbound connections on your chosen port:

```bash
# Windows Firewall (PowerShell as Admin)
New-NetFirewallRule -DisplayName "Logger Server" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow

# Linux (ufw)
sudo ufw allow 3000/tcp

# Linux (iptables)
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
```

### Authentication
The logger includes token-based authentication. Configure your auth tokens:

```env
AUTH_TOKENS={"your-app": "your-secure-token", "another-app": "another-token"}
```

### Rate Limiting
Built-in rate limiting protects against abuse:

```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### HTTPS/SSL
For production, always use HTTPS. You can:
1. Put the logger behind a reverse proxy (nginx, Apache)
2. Use a service like Cloudflare
3. Implement SSL directly in the application

### Reverse Proxy Example (nginx)
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Production Deployment

### Process Management
Use a process manager like PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "logger-server" -- start

# Set environment variables
pm2 set logger-server:HOST 0.0.0.0
pm2 set logger-server:PORT 3000

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Docker Deployment
Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t logger-server .
docker run -d -p 3000:3000 --name logger logger-server
```

### Cloud Deployment
The logger works on all major cloud platforms:
- **AWS**: EC2, ECS, Lambda (with serverless framework)
- **Google Cloud**: Compute Engine, Cloud Run, App Engine
- **Azure**: VM, Container Instances, App Service
- **Digital Ocean**: Droplets, App Platform
- **Heroku**: Set `HOST=0.0.0.0` in config vars

## Monitoring

### Health Check
The server provides a health check endpoint:
```
GET /health
```

### Logs
Application logs are written to the console. In production, redirect to files:
```bash
npm start > app.log 2>&1
```

### Resource Monitoring
Monitor CPU, memory, and disk usage. The logger stores logs on disk, so ensure adequate space.

## Troubleshooting

### Common Issues

1. **Server not accessible externally**
   - Ensure `HOST=0.0.0.0` is set
   - Check firewall rules
   - Verify port is not blocked by ISP

2. **Permission denied on port**
   - Ports < 1024 require root on Linux
   - Use port > 1024 or run with sudo

3. **High memory usage**
   - Adjust `max_log_file_size` setting
   - Implement log rotation
   - Monitor `log_retention_days`

4. **Rate limiting too strict**
   - Adjust `RATE_LIMIT_MAX_REQUESTS`
   - Increase `RATE_LIMIT_WINDOW_MS`
