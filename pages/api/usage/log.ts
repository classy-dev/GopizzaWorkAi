import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';

interface UsageLogRequest {
  menuName: string; // 필수: 메뉴 이름 (예: '번역')
  documentName?: string; // 선택: 문서 이름
  documentLength?: number; // 선택: 문서 길이 (문자 수)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 세션 확인 및 사용자 인증
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: '로그인이 필요한 서비스입니다.' });
    }

    const { menuName, documentName, documentLength }: UsageLogRequest =
      req.body;

    // menuName은 필수 필드
    if (!menuName) {
      return res
        .status(400)
        .json({ error: '메뉴 이름은 필수 입력 항목입니다.' });
    }

    try {
      // 데이터베이스에 사용 기록 저장
      await (prisma as any).usage.create({
        data: {
          userId: session.user.id,
          menuName,
          documentName: documentName || null,
          documentLength: documentLength || null,
        },
      });

      return res
        .status(200)
        .json({ success: true, message: '사용 기록이 저장되었습니다.' });
    } catch (dbError) {
      console.error('Usage 테이블 저장 중 오류:', dbError);
      // DB 저장 실패해도 사용자 경험에 영향이 없도록 성공 응답
      return res
        .status(200)
        .json({ success: true, message: '작업이 완료되었습니다.' });
    }
  } catch (error) {
    console.error('사용 기록 API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
