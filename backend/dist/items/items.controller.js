"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ItemsController", {
    enumerable: true,
    get: function() {
        return ItemsController;
    }
});
const _common = require("@nestjs/common");
const _itemsservice = require("./items.service");
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
let ItemsController = class ItemsController {
    async createLost(ownerId, body) {
        return this.itemsService.createLostItem(ownerId, body);
    }
    async createFound(finderId, body) {
        return this.itemsService.createFoundItem(finderId, body);
    }
    async findLost() {
        return this.itemsService.findLostItems();
    }
    async findFound() {
        return this.itemsService.findFoundItems();
    }
    async findOneLost(id) {
        return this.itemsService.findOneLost(id);
    }
    async findOneFound(id) {
        return this.itemsService.findOneFound(id);
    }
    async deleteLost(id) {
        return this.itemsService.deleteLost(id);
    }
    async deleteFound(id) {
        return this.itemsService.deleteFound(id);
    }
    constructor(itemsService){
        this.itemsService = itemsService;
    }
};
_ts_decorate([
    (0, _common.Post)('lost/:ownerId'),
    _ts_param(0, (0, _common.Param)('ownerId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "createLost", null);
_ts_decorate([
    (0, _common.Post)('found/:finderId'),
    _ts_param(0, (0, _common.Param)('finderId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "createFound", null);
_ts_decorate([
    (0, _common.Get)('lost'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "findLost", null);
_ts_decorate([
    (0, _common.Get)('found'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "findFound", null);
_ts_decorate([
    (0, _common.Get)('lost/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "findOneLost", null);
_ts_decorate([
    (0, _common.Get)('found/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "findOneFound", null);
_ts_decorate([
    (0, _common.Delete)('lost/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "deleteLost", null);
_ts_decorate([
    (0, _common.Delete)('found/:id'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ItemsController.prototype, "deleteFound", null);
ItemsController = _ts_decorate([
    (0, _common.Controller)('items'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _itemsservice.ItemsService === "undefined" ? Object : _itemsservice.ItemsService
    ])
], ItemsController);

//# sourceMappingURL=items.controller.js.map