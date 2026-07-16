"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MatchingModule", {
    enumerable: true,
    get: function() {
        return MatchingModule;
    }
});
const _common = require("@nestjs/common");
const _matchingservice = require("./matching.service");
const _matchingcontroller = require("./matching.controller");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let MatchingModule = class MatchingModule {
};
MatchingModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _matchingcontroller.MatchingController
        ],
        providers: [
            _matchingservice.MatchingService
        ],
        exports: [
            _matchingservice.MatchingService
        ]
    })
], MatchingModule);

//# sourceMappingURL=matching.module.js.map