"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppController", {
    enumerable: true,
    get: function() {
        return AppController;
    }
});
const _common = require("@nestjs/common");
const _appservice = require("./app.service");
const _notificationsservice = require("./notifications/notifications.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AppController = class AppController {
    getHello() {
        return this.appService.getHello();
    }
    async trackVisit(xForwardedFor, userAgent, ipAddress) {
        const rawIp = xForwardedFor || ipAddress || 'Unknown IP';
        const ip = rawIp.split(',')[0].trim();
        const ua = userAgent || 'Unknown Device';
        const visitTime = new Date().toLocaleString('en-GB', {
            timeZone: 'Africa/Accra'
        });
        const message = `🔔 *New CRN Website Visit!*\n\n` + `📅 *Time:* ${visitTime}\n` + `🌐 *IP:* \`${ip}\`\n` + `💻 *Device:* ${ua.substring(0, 80)}...`;
        const success = await this.notificationsService.sendWhatsAppAlert(message);
        if (!success) {
            return {
                success: false,
                error: 'Failed to process tracker'
            };
        }
        return {
            success: true,
            message: 'Visit logged successfully.'
        };
    }
    constructor(appService, notificationsService){
        this.appService = appService;
        this.notificationsService = notificationsService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
_ts_decorate([
    (0, _common.Post)('api/track-visit'),
    _ts_param(0, (0, _common.Headers)('x-forwarded-for')),
    _ts_param(1, (0, _common.Headers)('user-agent')),
    _ts_param(2, (0, _common.Ip)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], AppController.prototype, "trackVisit", null);
AppController = _ts_decorate([
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _appservice.AppService === "undefined" ? Object : _appservice.AppService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService
    ])
], AppController);

//# sourceMappingURL=app.controller.js.map