"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaimsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
let ClaimsService = class ClaimsService {
    prisma;
    usersService;
    constructor(prisma, usersService) {
        this.prisma = prisma;
        this.usersService = usersService;
    }
    async createClaim(claimantId, matchId, answers) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: {
                lostItem: true,
                foundItem: true,
            },
        });
        if (!match) {
            throw new common_1.NotFoundException(`Match with ID ${matchId} not found`);
        }
        if (match.lostItem.ownerId !== claimantId) {
            throw new common_1.BadRequestException('Only the owner of the lost item can claim this match');
        }
        const foundItem = match.foundItem;
        const secretQuestions = foundItem.secretQuestions || [];
        if (secretQuestions.length === 0) {
            throw new common_1.BadRequestException('This found item does not have verification questions');
        }
        const verificationScore = this.calculateVerificationScore(answers, secretQuestions);
        const claim = await this.prisma.claim.create({
            data: {
                matchId,
                claimantId,
                verificationScore,
                answers: answers,
                status: 'PENDING',
            },
        });
        if (verificationScore >= 70) {
            await this.approveClaim(claim.id, 'System auto-approved due to high ownership verification score');
        }
        else {
            if (verificationScore < 20) {
                await this.usersService.updateTrustScore(claimantId, -15, `Failed ownership verification for claim on [${foundItem.title}] (Score: ${verificationScore}%)`);
            }
        }
        return this.findOne(claim.id);
    }
    calculateVerificationScore(claimantAnswers, secretQuestions) {
        if (secretQuestions.length === 0)
            return 100;
        let totalScore = 0;
        const weightPerQuestion = 100 / secretQuestions.length;
        for (const sq of secretQuestions) {
            const ca = claimantAnswers.find((a) => a.question.trim().toLowerCase() === sq.question.trim().toLowerCase());
            if (!ca)
                continue;
            const qScore = this.compareText(ca.answer, sq.answer);
            totalScore += qScore * weightPerQuestion;
        }
        return Math.min(100, Math.round(totalScore));
    }
    compareText(ans1, ans2) {
        const cleanStr = (s) => s
            .toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
            .trim();
        const str1 = cleanStr(ans1);
        const str2 = cleanStr(ans2);
        if (str1 === str2)
            return 1.0;
        if (!str1 || !str2)
            return 0.0;
        const tokens1 = str1.split(/\s+/);
        const tokens2 = str2.split(/\s+/);
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter((x) => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        if (union.size === 0)
            return 0.0;
        return intersection.size / union.size;
    }
    async approveClaim(claimId, notes = 'Claim approved') {
        const claim = await this.prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                match: {
                    include: {
                        lostItem: true,
                        foundItem: true,
                    },
                },
            },
        });
        if (!claim) {
            throw new common_1.NotFoundException(`Claim with ID ${claimId} not found`);
        }
        await this.prisma.claim.update({
            where: { id: claimId },
            data: { status: 'APPROVED' },
        });
        await this.prisma.match.update({
            where: { id: claim.matchId },
            data: { status: 'RESOLVED' },
        });
        await this.prisma.lostItem.update({
            where: { id: claim.match.lostItemId },
            data: { status: 'RETURNED' },
        });
        await this.prisma.foundItem.update({
            where: { id: claim.match.foundItemId },
            data: { status: 'RETURNED' },
        });
        await this.usersService.updateTrustScore(claim.claimantId, 10, `Successfully recovered lost item [${claim.match.lostItem.title}]`);
        await this.usersService.updateTrustScore(claim.match.foundItem.finderId, 10, `Successfully returned found item [${claim.match.foundItem.title}] to its owner`);
        return this.findOne(claimId);
    }
    async rejectClaim(claimId, reason = 'Claim rejected') {
        const claim = await this.prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                match: {
                    include: {
                        lostItem: true,
                        foundItem: true,
                    },
                },
            },
        });
        if (!claim) {
            throw new common_1.NotFoundException(`Claim with ID ${claimId} not found`);
        }
        await this.prisma.claim.update({
            where: { id: claimId },
            data: { status: 'REJECTED' },
        });
        await this.prisma.match.update({
            where: { id: claim.matchId },
            data: { status: 'PENDING' },
        });
        await this.usersService.updateTrustScore(claim.claimantId, -15, `Rejected claim on found item [${claim.match.foundItem.title}]: ${reason}`);
        return this.findOne(claimId);
    }
    async findOne(id) {
        const claim = await this.prisma.claim.findUnique({
            where: { id },
            include: {
                claimant: true,
                match: {
                    include: {
                        lostItem: true,
                        foundItem: true,
                    },
                },
            },
        });
        if (!claim) {
            throw new common_1.NotFoundException(`Claim with ID ${id} not found`);
        }
        return claim;
    }
    async findAll() {
        return this.prisma.claim.findMany({
            include: {
                claimant: true,
                match: {
                    include: {
                        lostItem: true,
                        foundItem: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteClaim(id) {
        const claim = await this.prisma.claim.findUnique({ where: { id } });
        if (!claim) {
            throw new common_1.NotFoundException(`Claim with ID ${id} not found`);
        }
        return this.prisma.claim.delete({ where: { id } });
    }
};
exports.ClaimsService = ClaimsService;
exports.ClaimsService = ClaimsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], ClaimsService);
//# sourceMappingURL=claims.service.js.map