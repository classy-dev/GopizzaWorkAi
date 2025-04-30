import { PrismaClient } from '@prisma/client';

// PrismaClient 인스턴스를 전역 변수로 선언 (개발 중 Hot Reload 문제 방지)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 전역 객체에 prisma가 없다면 새로 생성
export const prisma = globalForPrisma.prisma || new PrismaClient();

// 개발 환경이 아니라면 전역 객체에 prisma 할당
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
