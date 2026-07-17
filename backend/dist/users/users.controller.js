"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersController", {
    enumerable: true,
    get: function() {
        return UsersController;
    }
});
const _common = require("@nestjs/common");
const _usersservice = require("./users.service");
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
let UsersController = class UsersController {
    async findAll() {
        return this.usersService.findAll();
    }
    async findOne(id) {
        return this.usersService.findOne(id);
    }
    async register(body) {
        return this.usersService.register(body);
    }
    async login(body, xForwardedFor, userAgent, ipAddress) {
        const rawIp = xForwardedFor || ipAddress || 'Unknown IP';
        const ip = rawIp.split(',')[0].trim();
        const ua = userAgent || 'Unknown Device';
        return this.usersService.login(body.studentId, body.password, ip, ua);
    }
    async verifyUser(id) {
        return this.usersService.verifyUser(id);
    }
    async deleteUser(id) {
        return this.usersService.deleteUser(id);
    }
    async getOrCreatePersona(body) {
        return this.usersService.findOrCreate(body.studentId, body.name, body.email, body.role || 'USER');
    }
    async updateTrust(id, body) {
        return this.usersService.updateTrustScore(id, body.scoreChange, body.reason);
    }
    constructor(usersService){
        this.usersService = usersService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)('register'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "register", null);
_ts_decorate([
    (0, _common.Post)('login'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Headers)('x-forwarded-for')),
    _ts_param(2, (0, _common.Headers)('user-agent')),
    _ts_param(3, (0, _common.Ip)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)(':id/verify'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "verifyUser", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
_ts_decorate([
    (0, _common.Post)('persona'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "getOrCreatePersona", null);
_ts_decorate([
    (0, _common.Post)(':id/trust'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], UsersController.prototype, "updateTrust", null);
UsersController = _ts_decorate([
    (0, _common.Controller)('users'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usersservice.UsersService === "undefined" ? Object : _usersservice.UsersService
    ])
], UsersController);

//# sourceMappingURL=users.controller.js.map