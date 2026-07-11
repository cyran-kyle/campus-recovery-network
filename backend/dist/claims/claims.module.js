"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClaimsModule", {
    enumerable: true,
    get: function() {
        return ClaimsModule;
    }
});
const _common = require("@nestjs/common");
const _claimsservice = require("./claims.service");
const _claimscontroller = require("./claims.controller");
const _usersmodule = require("../users/users.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ClaimsModule = class ClaimsModule {
};
ClaimsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _usersmodule.UsersModule
        ],
        controllers: [
            _claimscontroller.ClaimsController
        ],
        providers: [
            _claimsservice.ClaimsService
        ],
        exports: [
            _claimsservice.ClaimsService
        ]
    })
], ClaimsModule);

//# sourceMappingURL=claims.module.js.map