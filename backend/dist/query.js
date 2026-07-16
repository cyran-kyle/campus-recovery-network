"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _client = require("@prisma/client");
const _adapterpg = require("@prisma/adapter-pg");
const _pg = require("pg");
require("dotenv/config");
const connectionString = process.env.DATABASE_URL;
const pool = new _pg.Pool({
    connectionString
});
const adapter = new _adapterpg.PrismaPg(pool);
const prisma = new _client.PrismaClient({
    adapter
});
async function main() {
    const users = await prisma.user.findMany();
    console.log('--- USERS IN DATABASE ---');
    console.log(JSON.stringify(users, null, 2));
}
main().catch((e)=>{
    console.error(e);
}).finally(async ()=>{
    await prisma.$disconnect();
    await pool.end();
});

//# sourceMappingURL=query.js.map