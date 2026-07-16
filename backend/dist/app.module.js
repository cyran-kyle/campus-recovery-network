"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _appcontroller = require("./app.controller");
const _appservice = require("./app.service");
const _prismamodule = require("./prisma/prisma.module");
const _usersmodule = require("./users/users.module");
const _itemsmodule = require("./items/items.module");
const _matchingmodule = require("./matching/matching.module");
const _claimsmodule = require("./claims/claims.module");
const _analyticsmodule = require("./analytics/analytics.module");
const _notificationsmodule = require("./notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _prismamodule.PrismaModule,
            _usersmodule.UsersModule,
            _itemsmodule.ItemsModule,
            _matchingmodule.MatchingModule,
            _claimsmodule.ClaimsModule,
            _analyticsmodule.AnalyticsModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _appcontroller.AppController
        ],
        providers: [
            _appservice.AppService
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map