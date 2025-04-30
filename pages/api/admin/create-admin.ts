import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

// 개발 환경에서만 사용할 관리자 계정 생성 API
// 실제 프로덕션에서는 이 API를 제거하거나 추가 보안 조치 필요
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 개발 환경 확인 (개발 환경에서만 동작)
  const isDevEnv = process.env.NODE_ENV === 'development';
  if (!isDevEnv) {
    return res.status(403).json({ error: '개발 환경에서만 사용 가능한 API입니다.' });
  }

  try {
    const { userId, name, department, password } = req.body;

    // 필수 입력 값 확인
    if (!userId || !name || !department || !password) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 동일한 ID의 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });

    if (existingUser) {
      return res.status(400).json({ error: '이미 존재하는 사용자 ID입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 관리자 사용자 생성
    const user = await prisma.user.create({
      data: {
        userId,
        name,
        department,
        password: hashedPassword,
        isAdmin: true,
      },
    });

    // 응답에서 비밀번호 제외
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      message: '관리자 계정이 생성되었습니다.',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('관리자 계정 생성 오류:', error);
    return res.status(500).json({
      error: '관리자 계정을 생성하는 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
