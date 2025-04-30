import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';

// 타입 오류를 우회하기 위해 any 타입 사용
const prismaAny = prisma as any;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 세션 확인 및 관리자 권한 검증
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요한 서비스입니다.' });
    }
    
    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    // 관리자만 접근 가능
    if (!user?.isAdmin) {
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }

    // 페이지네이션 파라미터
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // 사용자 ID로 필터링 (선택 사항)
    const userId = req.query.userId as string;
    const whereClause = userId ? { userId } : {};
    
    // 활동 로그 데이터 조회
    const usages = await prismaAny.usage.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            department: true,
            userId: true
          }
        }
      },
      orderBy: {
        usageTime: 'desc'
      },
      skip,
      take: limit
    });
    
    // 전체 데이터 수 조회 (페이지네이션 용)
    const totalCount = await prismaAny.usage.count({
      where: whereClause
    });
    
    return res.status(200).json({
      data: usages,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('사용 로그 조회 중 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
