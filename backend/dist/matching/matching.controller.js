"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MatchingController", {
    enumerable: true,
    get: function() {
        return MatchingController;
    }
});
const _common = require("@nestjs/common");
const _matchingservice = require("./matching.service");
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
let MatchingController = class MatchingController {
    async findAll() {
        return this.matchingService.findAllMatches();
    }
    async getUserMatches(userId) {
        return this.matchingService.getUserMatches(userId);
    }
    constructor(matchingService){
        this.matchingService = matchingService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], MatchingController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('user/:userId'),
    _ts_param(0, (0, _common.Param)('userId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], MatchingController.prototype, "getUserMatches", null);
MatchingController = _ts_decorate([
    (0, _common.Controller)('matches'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _matchingservice.MatchingService === "undefined" ? Object : _matchingservice.MatchingService
    ])
], MatchingController);

//# sourceMappingURL=matching.controller.js.map