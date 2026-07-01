import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    })[]>;
    findOne(id: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    register(data: {
        studentId: string;
        name: string;
        course: string;
        sex: string;
        photo: string;
        password: string;
    }): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    login(studentId: string, password: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    verifyUser(id: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    deleteUser(id: string): Promise<{
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
    }>;
    findOrCreate(studentId: string, name: string, email: string, role?: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
    updateTrustScore(userId: string, scoreChange: number, reason: string): Promise<{
        trustLogs: {
            id: string;
            createdAt: Date;
            scoreChange: number;
            reason: string;
            userId: string;
        }[];
        _count: {
            lostItems: number;
            foundItems: number;
            claims: number;
        };
    } & {
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
    }>;
}
