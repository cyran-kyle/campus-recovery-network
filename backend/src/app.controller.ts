import { Controller, Get, Post, Headers, Ip } from '@nestjs/common';
import { AppService } from './app.service';
import { NotificationsService } from './notifications/notifications.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly notificationsService: NotificationsService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('api/track-visit')
  async trackVisit(
    @Headers('x-forwarded-for') xForwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
    @Ip() ipAddress?: string,
  ) {
    const rawIp = xForwardedFor || ipAddress || 'Unknown IP';
    const ip = rawIp.split(',')[0].trim();
    const ua = userAgent || 'Unknown Device';
    const visitTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });

    const message = `🔔 *New CAMPUS RECOVERY NETWORK Website Visit!*\n\n` +
      `📅 *Time:* ${visitTime}\n` +
      `🌐 *IP:* \`${ip}\`\n` +
      `💻 *Device:* ${ua.substring(0, 80)}...`;

    const success = await this.notificationsService.sendWhatsAppAlert(message);
    if (!success) {
      return { success: false, error: 'Failed to process tracker' };
    }
    return { success: true, message: 'Visit logged successfully.' };
  }
}


