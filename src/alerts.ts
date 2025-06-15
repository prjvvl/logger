import TelegramBot from 'node-telegram-bot-api';
import { LogEntry } from './types';
import { ConfigManager } from './config';

interface AlertRateLimit {
  count: number;
  lastReset: number;
  cooldownUntil: number;
}

export class AlertManager {
  private config: ConfigManager;
  private telegramBot: TelegramBot | null = null;
  private rateLimit: AlertRateLimit = {
    count: 0,
    lastReset: Date.now(),
    cooldownUntil: 0
  };

  constructor() {
    this.config = ConfigManager.getInstance();
    this.initializeTelegramBot();
  }

  private initializeTelegramBot(): void {
    const telegramConfig = this.config.getAlertConfig().telegram;
    
    if (telegramConfig.enabled && telegramConfig.bot_token !== 'your_telegram_bot_token') {
      try {
        this.telegramBot = new TelegramBot(telegramConfig.bot_token);
        console.log('Telegram bot initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Telegram bot:', error);
      }
    }
  }

  async processLog(log: LogEntry): Promise<void> {
    // Only process logs with action: "alert"
    if (log.action !== 'alert') {
      return;
    }

    const telegramConfig = this.config.getAlertConfig().telegram;
    
    // Check if telegram alerts are enabled and level is allowed
    if (!telegramConfig.enabled || !telegramConfig.alert_levels.includes(log.level)) {
      return;
    }

    // Check rate limiting
    if (!this.canSendAlert()) {
      console.log('Alert rate limit exceeded, skipping alert');
      return;
    }

    await this.sendTelegramAlert(log);
  }

  private canSendAlert(): boolean {
    const now = Date.now();
    const telegramConfig = this.config.getAlertConfig().telegram;
    const { max_alerts_per_minute, cooldown_minutes } = telegramConfig.rate_limit;

    // Check if we're in cooldown period
    if (now < this.rateLimit.cooldownUntil) {
      return false;
    }

    // Reset counter if more than a minute has passed
    if (now - this.rateLimit.lastReset > 60000) {
      this.rateLimit.count = 0;
      this.rateLimit.lastReset = now;
    }

    // Check if we've exceeded the limit
    if (this.rateLimit.count >= max_alerts_per_minute) {
      // Set cooldown period
      this.rateLimit.cooldownUntil = now + (cooldown_minutes * 60000);
      return false;
    }

    return true;
  }

  private async sendTelegramAlert(log: LogEntry): Promise<void> {
    if (!this.telegramBot) {
      console.error('Telegram bot not initialized');
      return;
    }

    const telegramConfig = this.config.getAlertConfig().telegram;
    
    try {
      const message = this.formatTelegramMessage(log);
      
      await this.telegramBot.sendMessage(telegramConfig.chat_id, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      });

      // Increment rate limit counter
      this.rateLimit.count++;
      
      console.log(`Telegram alert sent for ${log.source} - ${log.group}`);
      
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
    }
  }

  private formatTelegramMessage(log: LogEntry): string {
    const emoji = this.getLevelEmoji(log.level);
    const timestamp = new Date(log.timestamp).toLocaleString();
    
    let message = `${emoji} <b>ALERT - ${log.source}</b>\n\n`;
    message += `<b>Level:</b> ${log.level.toUpperCase()}\n`;
    message += `<b>Group:</b> ${log.group}\n`;
    message += `<b>Message:</b> ${log.message}\n\n`;
    
    if (log.details && Object.keys(log.details).length > 0) {
      message += '<b>Details:</b>\n';
      
      for (const [key, value] of Object.entries(log.details)) {
        if (value !== null && value !== undefined) {
          const displayValue = typeof value === 'object' 
            ? JSON.stringify(value, null, 2) 
            : String(value);
          message += `• <b>${key}:</b> ${displayValue}\n`;
        }
      }
      message += '\n';
    }
    
    message += `<b>Time:</b> ${timestamp}\n`;
    message += `<b>Position:</b> ${log.position}`;
    
    return message;
  }

  private getLevelEmoji(level: string): string {
    switch (level) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'debug':
        return '🐛';
      default:
        return '📝';
    }
  }

  // Method to test telegram configuration
  async testTelegramConnection(): Promise<boolean> {
    const telegramConfig = this.config.getAlertConfig().telegram;
    
    if (!telegramConfig.enabled || !this.telegramBot) {
      return false;
    }

    try {
      const testMessage = '🧪 <b>Logger Test Alert</b>\n\nThis is a test message to verify Telegram integration is working correctly.';
      
      await this.telegramBot.sendMessage(telegramConfig.chat_id, testMessage, {
        parse_mode: 'HTML'
      });
      
      console.log('Telegram test message sent successfully');
      return true;
      
    } catch (error) {
      console.error('Telegram test failed:', error);
      return false;
    }
  }

  // Method to get alert statistics
  getRateLimitStatus(): { count: number; cooldownUntil: number; canSendAlert: boolean } {
    return {
      count: this.rateLimit.count,
      cooldownUntil: this.rateLimit.cooldownUntil,
      canSendAlert: this.canSendAlert()
    };
  }
}
