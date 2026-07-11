"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, // Vercel serverless entrypoint handler
"default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
require("dotenv/config");
const _core = require("@nestjs/core");
const _appmodule = require("./app.module");
const _express = require("express");
let serverHandler;
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    app.use((0, _express.json)({
        limit: '50mb'
    }));
    app.use((0, _express.urlencoded)({
        limit: '50mb',
        extended: true
    }));
    app.enableCors({
        origin: true,
        credentials: true
    });
    if (process.env.VERCEL) {
        await app.init();
        return app.getHttpAdapter().getInstance();
    } else {
        await app.listen(process.env.PORT ?? 3000);
    }
}
// Local development startup
if (!process.env.VERCEL) {
    bootstrap();
}
const _default = async (req, res)=>{
    if (!serverHandler) {
        serverHandler = await bootstrap();
    }
    return serverHandler(req, res);
};

//# sourceMappingURL=main.js.map