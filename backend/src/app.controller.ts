import { Controller, Get, Post, Headers, Ip } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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

    const message = `🔔 *New CRN Website Visit!*\n\n` +
                    `📅 *Time:* ${visitTime}\n` +
                    `🌐 *IP:* \`${ip}\`\n` +
                    `💻 *Device:* ${ua.substring(0, 80)}...`;

    try {
      const rawApiUrl = process.env.LEVANTER_API_URL;
      const apiKey = process.env.LEVANTER_API_KEY;
      if (!rawApiUrl || !apiKey) {
        console.warn('Levanter API configuration missing, visitor tracking skipped.');
        return { success: false, error: 'Tracking not configured' };
      }
      
      // Sanitize URL (remove markdown link wrapper if pasted by mistake, e.g. [url](url))
      let apiUrl = rawApiUrl.trim();
      const mdLinkMatch = apiUrl.match(/\[.*?\]\((.*?)\)/);
      if (mdLinkMatch) {
        apiUrl = mdLinkMatch[1];
      }
      apiUrl = apiUrl.replace(/\/+$/, '');

      const response = await fetch(`${apiUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          to: '233596371001', // Your WhatsApp number
          type: 'text',
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API responded with status ${response.status}`);
      }

      return { success: true, message: 'Visit logged successfully.' };
    } catch (error: any) {
      console.error('Failed to send visit alert:', error.message);
      return { success: false, error: 'Failed to process tracker' };
    }
  }
}

