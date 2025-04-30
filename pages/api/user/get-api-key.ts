import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 세션 확인 및 사용자 인증
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: '로그인이 필요한 서비스입니다.' });
    }
    
    // 사용자의 API 키 가져오기
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKey: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // API 키 반환 (없는 경우 null)
    return res.status(200).json({ apiKey: user.apiKey });
  } catch (error) {
    console.error('API 키 조회 중 오류 발생:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
