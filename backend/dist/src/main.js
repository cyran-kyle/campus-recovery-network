"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
let serverHandler;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((0, express_1.json)({ limit: '50mb' }));
    app.use((0, express_1.urlencoded)({ limit: '50mb', extended: true }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    if (process.env.VERCEL) {
        await app.init();
        return app.getHttpAdapter().getInstance();
    }
    else {
        await app.listen(process.env.PORT ?? 3000);
    }
}
if (!process.env.VERCEL) {
    bootstrap();
}
exports.default = async (req, res) => {
    if (!serverHandler) {
        serverHandler = await bootstrap();
    }
    return serverHandler(req, res);
};
//# sourceMappingURL=main.js.map