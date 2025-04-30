import { promises as fsPromises } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

// 진행 상태를 저장할 디렉토리
const PROGRESS_DIR = path.join(process.cwd(), 'data', 'progress');

interface SaveProgressRequest {
  translatedPages: Record<string, boolean>;
  fileName: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 디렉토리 생성 (없는 경우)
    await fsPromises.mkdir(PROGRESS_DIR, { recursive: true });

    // 요청 데이터 파싱
    const { translatedPages, fileName }: SaveProgressRequest = req.body;

    if (!fileName) {
      return res.status(400).json({ error: '파일 이름이 필요합니다.' });
    }

    // 안전한 파일 이름 생성
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const progressFile = path.join(
      PROGRESS_DIR,
      `${safeFileName}_progress.json`
    );

    // 현재 시간 추가
    const progressData = {
      translatedPages,
      timestamp: new Date().toISOString(),
    };

    // 파일에 저장
    await fsPromises.writeFile(
      progressFile,
      JSON.stringify(progressData, null, 2),
      'utf-8'
    );

    // 결과 반환
    res.status(200).json({
      success: true,
      message: '번역 진행 상태가 저장되었습니다.',
    });
  } catch (error) {
    console.error('진행 상태 저장 중 오류:', error);
    res
      .status(500)
      .json({ error: '서버 오류: 진행 상태 저장 중 문제가 발생했습니다.' });
  }
}
