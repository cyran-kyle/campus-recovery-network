import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendWhatsAppAlert(message: string): Promise<boolean> {
    const rawApiUrl = process.env.LEVANTER_API_URL;
    const apiKey = process.env.LEVANTER_API_KEY;

    if (!rawApiUrl || !apiKey) {
      this.logger.warn('Levanter API configuration missing, WhatsApp alert skipped.');
      return false;
    }

    // Sanitize URL
    let apiUrl = rawApiUrl.trim();
    const mdLinkMatch = apiUrl.match(/\[.*?\]\((.*?)\)/);
    if (mdLinkMatch) {
      apiUrl = mdLinkMatch[1];
    }
    apiUrl = apiUrl.replace(/\/+$/, '');

    try {
      const response = await fetch(`${apiUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          to: '233596371001',
          type: 'text',
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API responded with status ${response.status}`);
      }

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp alert: ${error.message}`);
      return false;
    }
  }

  async sendUserLoginAlert(user: any, ipAddress?: string, userAgent?: string) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const ip = ipAddress || 'Unknown IP';
    const ua = userAgent || 'Unknown Device';
    const message = `🔑 *CRN User Login!*\n\n` +
                    `👤 *User:* ${user.name} (\`${user.studentId}\`)\n` +
                    `📅 *Time:* ${time}\n` +
                    `🌐 *IP:* \`${ip}\`\n` +
                    `💻 *Device:* ${ua.substring(0, 80)}...`;
    return this.sendWhatsAppAlert(message);
  }

  async sendUserRegisteredAlert(user: any) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const message = `👤 *New User Registered!*\n\n` +
                    `📅 *Time:* ${time}\n` +
                    `📛 *Name:* ${user.name}\n` +
                    `🆔 *Student ID:* \`${user.studentId}\`\n` +
                    `📚 *Course:* ${user.course || 'N/A'}\n` +
                    `🚻 *Gender:* ${user.sex || 'N/A'}`;
    return this.sendWhatsAppAlert(message);
  }

  async sendLostItemAlert(lostItem: any, ownerName: string) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const message = `🔍 *New Lost Item Reported!*\n\n` +
                    `📅 *Time:* ${time}\n` +
                    `👤 *Owner:* ${ownerName}\n` +
                    `📦 *Item:* *${lostItem.title}*\n` +
                    `📁 *Category:* ${lostItem.category}\n` +
                    `📍 *Location:* ${lostItem.locationLost}\n` +
                    `📝 *Description:* ${lostItem.description || 'No description'}`;
    return this.sendWhatsAppAlert(message);
  }

  async sendFoundItemAlert(foundItem: any, finderName: string) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const message = `🎁 *New Found Item Reported!*\n\n` +
                    `📅 *Time:* ${time}\n` +
                    `👤 *Finder:* ${finderName}\n` +
                    `📦 *Item:* *${foundItem.title}*\n` +
                    `📁 *Category:* ${foundItem.category}\n` +
                    `📍 *Location:* ${foundItem.locationFound}\n` +
                    `📝 *Description:* ${foundItem.description || 'No description'}`;
    return this.sendWhatsAppAlert(message);
  }

  async sendMatchDetectedAlert(score: number, lostTitle: string, foundTitle: string) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const message = `⚡ *Potential Match Detected!*\n\n` +
                    `📅 *Time:* ${time}\n` +
                    `📈 *Match Score:* *${score}%*\n` +
                    `🔍 *Lost Item:* ${lostTitle}\n` +
                    `🎁 *Found Item:* ${foundTitle}`;
    return this.sendWhatsAppAlert(message);
  }

  async sendClaimSubmittedAlert(claim: any, claimantName: string, lostTitle: string, score: number) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const message = `📋 *New Claim Submitted!*\n\n` +
                    `📅 *Time:* ${time}\n` +
                    `👤 *Claimant:* ${claimantName}\n` +
                    `📦 *Item claimed:* ${lostTitle}\n` +
                    `📊 *Verification Score:* *${score}%*\n` +
                    `⚙️ *Status:* ${claim.status}`;
    return this.sendWhatsAppAlert(message);
  }

  async sendItemRecoveredAlert(title: string, claimantName: string, finderName: string) {
    const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Accra' });
    const message = `🎉 *Item Successfully Recovered!*\n\n` +
                    `📅 *Time:* ${time}\n` +
                    `📦 *Item:* *${title}*\n` +
                    `👤 *Claimant (Owner):* ${claimantName}\n` +
                    `🤝 *Returned by Finder:* ${finderName}\n` +
                    `✅ *Recovery Status:* Handover Completed & Verified!`;
    return this.sendWhatsAppAlert(message);
  }
}
