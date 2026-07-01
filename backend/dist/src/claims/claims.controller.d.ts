import { ClaimsService } from './claims.service';
export declare class ClaimsController {
    private readonly claimsService;
    constructor(claimsService: ClaimsService);
    createClaim(claimantId: string, body: {
        matchId: string;
        answers: any[];
    }): Promise<{
        match: {
            lostItem: {
                id: string;
                createdAt: Date;
                ownerId: string;
                title: string;
                description: string;
                category: string;
                locationLost: string;
                dateLost: Date;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
            };
            foundItem: {
                id: string;
                createdAt: Date;
                title: string;
                description: string;
                category: string;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
                finderId: string;
                locationFound: string;
                dateFound: Date;
                secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        };
        claimant: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        verificationScore: number;
        answers: import("@prisma/client/runtime/client").JsonValue;
        matchId: string;
        claimantId: string;
    }>;
    approve(id: string): Promise<{
        match: {
            lostItem: {
                id: string;
                createdAt: Date;
                ownerId: string;
                title: string;
                description: string;
                category: string;
                locationLost: string;
                dateLost: Date;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
            };
            foundItem: {
                id: string;
                createdAt: Date;
                title: string;
                description: string;
                category: string;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
                finderId: string;
                locationFound: string;
                dateFound: Date;
                secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        };
        claimant: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        verificationScore: number;
        answers: import("@prisma/client/runtime/client").JsonValue;
        matchId: string;
        claimantId: string;
    }>;
    reject(id: string, body: {
        reason?: string;
    }): Promise<{
        match: {
            lostItem: {
                id: string;
                createdAt: Date;
                ownerId: string;
                title: string;
                description: string;
                category: string;
                locationLost: string;
                dateLost: Date;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
            };
            foundItem: {
                id: string;
                createdAt: Date;
                title: string;
                description: string;
                category: string;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
                finderId: string;
                locationFound: string;
                dateFound: Date;
                secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        };
        claimant: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        verificationScore: number;
        answers: import("@prisma/client/runtime/client").JsonValue;
        matchId: string;
        claimantId: string;
    }>;
    findAll(): Promise<({
        match: {
            lostItem: {
                id: string;
                createdAt: Date;
                ownerId: string;
                title: string;
                description: string;
                category: string;
                locationLost: string;
                dateLost: Date;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
            };
            foundItem: {
                id: string;
                createdAt: Date;
                title: string;
                description: string;
                category: string;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
                finderId: string;
                locationFound: string;
                dateFound: Date;
                secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        };
        claimant: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        verificationScore: number;
        answers: import("@prisma/client/runtime/client").JsonValue;
        matchId: string;
        claimantId: string;
    })[]>;
    findOne(id: string): Promise<{
        match: {
            lostItem: {
                id: string;
                createdAt: Date;
                ownerId: string;
                title: string;
                description: string;
                category: string;
                locationLost: string;
                dateLost: Date;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
            };
            foundItem: {
                id: string;
                createdAt: Date;
                title: string;
                description: string;
                category: string;
                imageUrl: string | null;
                status: string;
                fingerprint: string | null;
                finderId: string;
                locationFound: string;
                dateFound: Date;
                secretQuestions: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: string;
            lostItemId: string;
            foundItemId: string;
            score: number;
        };
        claimant: {
            id: string;
            studentId: string;
            name: string;
            email: string | null;
            course: string | null;
            photo: string | null;
            sex: string | null;
            password: string;
            isVerified: boolean;
            trustScore: number;
            role: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        status: string;
        verificationScore: number;
        answers: import("@prisma/client/runtime/client").JsonValue;
        matchId: string;
        claimantId: string;
    }>;
    deleteClaim(id: string): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        verificationScore: number;
        answers: import("@prisma/client/runtime/client").JsonValue;
        matchId: string;
        claimantId: string;
    }>;
}
