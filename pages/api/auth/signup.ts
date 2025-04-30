import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, department, userId, password } = req.body;

    // 입력값 검증
    if (!name || !department || !userId || !password) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    // 소속본부 유효성 검증
    const validDepartments = [
      '국내사업본부',
      '상품본부',
      '브랜드기획본부',
      '경영관리본부',
      '글로벌전략실',
      '푸드테크본부',
      '테스트',
    ];

    if (!validDepartments.includes(department)) {
      return res.status(400).json({ error: '유효하지 않은 소속본부입니다.' });
    }

    // 사용자 ID 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { userId },
    });

    if (existingUser) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        department,
        userId,
        password: hashedPassword,
        apiKey: null, // API 키는 초기에는 null, 관리자가 나중에 할당
      },
    });

    // 생성된 사용자 반환 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('회원가입 중 오류:', error);
    return res.status(500).json({
      error: '회원가입 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
