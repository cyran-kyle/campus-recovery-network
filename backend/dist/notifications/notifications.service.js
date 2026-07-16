"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsService", {
    enumerable: true,
    get: function() {
        return NotificationsService;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let NotificationsService = class NotificationsService {
    async sendWhatsAppAlert(message) {
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
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    to: '233596371001',
                    type: 'text',
                    text: message
                })
            });
            if (!response.ok) {
                throw new Error(`WhatsApp API responded with status ${response.status}`);
            }
            return true;
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp alert: ${error.message}`);
            return false;
        }
    }
    async sendUserRegisteredAlert(user) {
        const time = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `👤 *New User Registered!*\n\n` + `📅 *Time:* ${time}\n` + `📛 *Name:* ${user.name}\n` + `🆔 *Student ID:* \`${user.studentId}\`\n` + `📚 *Course:* ${user.course || 'N/A'}\n` + `🚻 *Gender:* ${user.sex || 'N/A'}`;
        return this.sendWhatsAppAlert(message);
    }
    async sendLostItemAlert(lostItem, ownerName) {
        const time = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `🔍 *New Lost Item Reported!*\n\n` + `📅 *Time:* ${time}\n` + `👤 *Owner:* ${ownerName}\n` + `📦 *Item:* *${lostItem.title}*\n` + `📁 *Category:* ${lostItem.category}\n` + `📍 *Location:* ${lostItem.locationLost}\n` + `📝 *Description:* ${lostItem.description || 'No description'}`;
        return this.sendWhatsAppAlert(message);
    }
    async sendFoundItemAlert(foundItem, finderName) {
        const time = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `🎁 *New Found Item Reported!*\n\n` + `📅 *Time:* ${time}\n` + `👤 *Finder:* ${finderName}\n` + `📦 *Item:* *${foundItem.title}*\n` + `📁 *Category:* ${foundItem.category}\n` + `📍 *Location:* ${foundItem.locationFound}\n` + `📝 *Description:* ${foundItem.description || 'No description'}`;
        return this.sendWhatsAppAlert(message);
    }
    async sendMatchDetectedAlert(score, lostTitle, foundTitle) {
        const time = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `⚡ *Potential Match Detected!*\n\n` + `📅 *Time:* ${time}\n` + `📈 *Match Score:* *${score}%*\n` + `🔍 *Lost Item:* ${lostTitle}\n` + `🎁 *Found Item:* ${foundTitle}`;
        return this.sendWhatsAppAlert(message);
    }
    async sendClaimSubmittedAlert(claim, claimantName, lostTitle, score) {
        const time = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `📋 *New Claim Submitted!*\n\n` + `📅 *Time:* ${time}\n` + `👤 *Claimant:* ${claimantName}\n` + `📦 *Item claimed:* ${lostTitle}\n` + `📊 *Verification Score:* *${score}%*\n` + `⚙️ *Status:* ${claim.status}`;
        return this.sendWhatsAppAlert(message);
    }
    async sendItemRecoveredAlert(title, claimantName, finderName) {
        const time = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `🎉 *Item Successfully Recovered!*\n\n` + `📅 *Time:* ${time}\n` + `📦 *Item:* *${title}*\n` + `👤 *Claimant (Owner):* ${claimantName}\n` + `🤝 *Returned by Finder:* ${finderName}\n` + `✅ *Recovery Status:* Handover Completed & Verified!`;
        return this.sendWhatsAppAlert(message);
    }
    constructor(){
        this.logger = new _common.Logger(NotificationsService.name);
    }
};
NotificationsService = _ts_decorate([
    (0, _common.Injectable)()
], NotificationsService);

//# sourceMappingURL=notifications.service.js.map