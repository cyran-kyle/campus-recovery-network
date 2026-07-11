"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClaimsController", {
    enumerable: true,
    get: function() {
        return ClaimsController;
    }
});
const _common = require("@nestjs/common");
const _claimsservice = require("./claims.service");
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
let ClaimsController = class ClaimsController {
    async createClaim(claimantId, body) {
        return this.claimsService.createClaim(claimantId, body.matchId, body.answers);
    }
    async approve(id) {
        return this.claimsService.approveClaim(id);
    }
    async reject(id, body) {
        return this.claimsService.rejectClaim(id, body?.reason || 'Incorrect answers');
    }
    async findAll() {
        return this.claimsService.findAll();
    }
    async findOne(id) {
        return this.claimsService.findOne(id);
    }
    async deleteClaim(id) {
        return this.claimsService.deleteClaim(id);
    }
    constructor(claimsService){
        this.claimsService = claimsService;
    }
};
_ts_decorate([
    (0, _common.Post)(':claimantId'),
    _ts_param(0, (0, _common.Param)('claimantId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClaimsController.prototype, "createClaim", null);
_ts_decorate([
    (0, _common.Post)(':id/approve'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ClaimsController.prototype, "approve", null);
_ts_decorate([
    (0, _common.Post)(':id/reject'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ClaimsController.prototype, "reject", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], ClaimsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ClaimsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ClaimsController.prototype, "deleteClaim", null);
ClaimsController = _ts_decorate([
    (0, _common.Controller)('claims'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _claimsservice.ClaimsService === "undefined" ? Object : _claimsservice.ClaimsService
    ])
], ClaimsController);

//# sourceMappingURL=claims.controller.js.map