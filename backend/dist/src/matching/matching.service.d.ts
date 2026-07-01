import { PrismaService } from '../prisma/prisma.service';
import { LostItem, FoundItem } from '@prisma/client';
export declare class MatchingService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    matchLostItem(lostItem: LostItem): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        lostItemId: string;
        foundItemId: string;
        score: number;
    }[]>;
    matchFoundItem(foundItem: FoundItem): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        lostItemId: string;
        foundItemId: string;
        score: number;
    }[]>;
    calculateMatchScore(lost: LostItem, found: FoundItem): number;
    private areLocationsNear;
    private calculateKeywordSimilarity;
    private calculateFingerprintSimilarity;
    getUserMatches(userId: string): Promise<({
        claims: {
            id: string;
            createdAt: Date;
            status: string;
            verificationScore: number;
            answers: import("@prisma/client/runtime/client").JsonValue;
            matchId: string;
            claimantId: string;
        }[];
        lostItem: {
            owner: {
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
            finder: {
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
    })[]>;
    findAllMatches(): Promise<({
        lostItem: {
            owner: {
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
            finder: {
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
    })[]>;
}
