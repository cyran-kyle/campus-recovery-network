"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("../notifications/notifications.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UsersService = class UsersService {
    async findAll() {
        return this.prisma.user.findMany({
            orderBy: {
                trustScore: 'desc'
            },
            include: {
                _count: {
                    select: {
                        lostItems: true,
                        foundItems: true,
                        claims: true
                    }
                }
            }
        });
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            },
            include: {
                trustLogs: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        lostItems: true,
                        foundItems: true,
                        claims: true
                    }
                }
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async register(data) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                studentId: {
                    equals: data.studentId,
                    mode: 'insensitive'
                }
            }
        });
        if (existingUser) {
            throw new _common.BadRequestException(`User with ID number ${data.studentId} already exists`);
        }
        const user = await this.prisma.user.create({
            data: {
                studentId: data.studentId,
                name: data.name,
                course: data.course,
                sex: data.sex,
                photo: data.photo,
                password: data.password,
                role: 'USER',
                isVerified: false,
                trustScore: 100
            }
        });
        // Log initial trust points
        await this.prisma.trustLog.create({
            data: {
                userId: user.id,
                scoreChange: 100,
                reason: 'Account creation registration bonus'
            }
        });
        // Send WhatsApp Alert
        this.notificationsService.sendUserRegisteredAlert(user).catch((err)=>{
            console.error('Failed to send registration alert:', err);
        });
        return this.findOne(user.id);
    }
    async login(studentId, password, ipAddress, userAgent) {
        const user = await this.prisma.user.findFirst({
            where: {
                studentId: {
                    equals: studentId,
                    mode: 'insensitive'
                }
            }
        });
        if (!user || user.password !== password) {
            throw new _common.UnauthorizedException('Invalid ID number or password');
        }
        // Send WhatsApp Alert asynchronously (fire-and-forget)
        this.notificationsService.sendUserLoginAlert(user, ipAddress, userAgent).catch((err)=>{
            console.error('Failed to send login alert:', err);
        });
        return this.findOne(user.id);
    }
    async verifyUser(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with ID ${id} not found`);
        }
        await this.prisma.user.update({
            where: {
                id
            },
            data: {
                isVerified: true
            }
        });
        return this.findOne(id);
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({
            where: {
                id
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with ID ${id} not found`);
        }
        return this.prisma.user.delete({
            where: {
                id
            }
        });
    }
    async findOrCreate(studentId, name, email, role = 'USER') {
        let user = await this.prisma.user.findUnique({
            where: {
                studentId
            }
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    studentId,
                    name,
                    email,
                    role,
                    password: 'Password123',
                    isVerified: true,
                    trustScore: 100
                }
            });
            // Log initial trust points
            await this.prisma.trustLog.create({
                data: {
                    userId: user.id,
                    scoreChange: 100,
                    reason: 'Account creation registration bonus'
                }
            });
            // Send WhatsApp Alert
            this.notificationsService.sendUserRegisteredAlert(user).catch((err)=>{
                console.error('Failed to send registration alert:', err);
            });
        }
        return this.findOne(user.id);
    }
    async updateTrustScore(userId, scoreChange, reason) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            throw new _common.NotFoundException(`User with ID ${userId} not found`);
        }
        const newScore = Math.max(0, user.trustScore + scoreChange);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    trustScore: newScore
                }
            }),
            this.prisma.trustLog.create({
                data: {
                    userId,
                    scoreChange,
                    reason
                }
            })
        ]);
        return this.findOne(userId);
    }
    constructor(prisma, notificationsService){
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map