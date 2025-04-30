import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

// 번역 진행 상태 인터페이스
interface TranslationProgress {
  pdfName: string;
  chunks: {
    id: string;
    text: string;
    translation: string;
    pages: number[];
  }[];
  completedPages: number[];
  targetLanguage: string;
  timestamp: number;
}

/**
 * 번역 진행 상태 로드 API 핸들러
 *
 * 쿼리 파라미터:
 * - pdfName: 로드할 PDF 파일 이름 (required)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfName } = req.query;

    if (!pdfName || typeof pdfName !== 'string') {
      return res.status(400).json({
        error: 'PDF 파일 이름이 필요합니다.',
      });
    }

    // 저장된 번역 진행 상태를 로드하는 경로
    // 실제 구현에서는 사용자 ID 등을 포함하여 고유한 경로 생성 필요
    const sanitizedFileName = pdfName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const progressDir = path.join(process.cwd(), 'data', 'translations');
    const progressFilePath = path.join(
      progressDir,
      `${sanitizedFileName}.json`
    );

    // 디렉토리 존재 확인
    if (!fs.existsSync(progressDir)) {
      fs.mkdirSync(progressDir, { recursive: true });
      return res.status(404).json({
        error: '저장된 번역 진행 상태가 없습니다.',
        notFound: true,
      });
    }

    // 파일 존재 확인
    if (!fs.existsSync(progressFilePath)) {
      return res.status(404).json({
        error: '해당 PDF에 대한 저장된 번역 진행 상태가 없습니다.',
        notFound: true,
      });
    }

    // 파일에서 데이터 로드
    const progressData = fs.readFileSync(progressFilePath, 'utf8');
    const progress: TranslationProgress = JSON.parse(progressData);

    // 성공 응답
    return res.status(200).json({
      success: true,
      progress,
    });
  } catch (error: unknown) {
    console.error('번역 진행 상태 로드 중 오류:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';

    return res.status(500).json({
      error: `번역 진행 상태 로드 중 오류 발생: ${errorMessage}`,
    });
  }
}
