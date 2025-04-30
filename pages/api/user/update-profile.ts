import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 세션에서 사용자 정보 가져오기
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: '인증되지 않은 요청입니다.' });
    }

    const { name, department, currentPassword, newPassword } = req.body;
    
    // 기존 사용자 검색
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const updatedData: any = {};
    
    // 이름과 부서는 항상 업데이트 가능
    if (name) updatedData.name = name;
    if (department) updatedData.department = department;

    // 비밀번호 변경이 요청된 경우
    if (currentPassword && newPassword) {
      // 현재 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
      }
      
      // 새 비밀번호 해싱
      updatedData.password = await bcrypt.hash(newPassword, 10);
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updatedData,
    });

    // 비밀번호 필드 제외하고 반환
    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('프로필 업데이트 중 오류:', error);
    return res.status(500).json({ 
      error: '프로필 업데이트 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
}
