import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 세션 확인 및 관리자 권한 검증
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
  }
  
  // 관리자 권한 체크 (여기서는 간단하게 isAdmin 필드로 체크합니다)
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (!adminUser?.isAdmin) {
    return res.status(403).json({ error: '권한이 없습니다. 관리자만 접근할 수 있습니다.' });
  }

  // GET 요청 처리: 모든 사용자의 API 키 정보 조회
  if (req.method === 'GET') {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          userId: true,
          department: true,
          apiKey: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return res.status(200).json(users);
    } catch (error) {
      console.error('사용자 API 키 정보 조회 오류:', error);
      return res.status(500).json({ 
        error: '사용자 정보를 조회하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  // POST 요청 처리: 특정 사용자의 API 키 생성 또는 갱신
  if (req.method === 'POST') {
    try {
      const { userId, apiKey } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
      }

      if (!apiKey || apiKey.trim() === '') {
        return res.status(400).json({ error: 'API 키를 입력해주세요.' });
      }
      
      // 사용자 정보 업데이트
      const user = await prisma.user.update({
        where: { id: userId },
        data: { apiKey },
        select: {
          id: true,
          name: true,
          userId: true,
          department: true,
          apiKey: true,
        },
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error('API 키 생성 오류:', error);
      return res.status(500).json({ 
        error: 'API 키를 생성하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  // DELETE 요청 처리: 특정 사용자의 API 키 삭제
  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: '사용자 ID가 필요합니다.' });
      }

      // API 키 삭제 (null로 설정)
      const user = await prisma.user.update({
        where: { id: userId },
        data: { apiKey: null },
        select: {
          id: true,
          name: true,
          userId: true,
          department: true,
          apiKey: true,
        },
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error('API 키 삭제 오류:', error);
      return res.status(500).json({ 
        error: 'API 키를 삭제하는 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  }

  // 지원하지 않는 HTTP 메소드
  return res.status(405).json({ error: 'Method Not Allowed' });
}
