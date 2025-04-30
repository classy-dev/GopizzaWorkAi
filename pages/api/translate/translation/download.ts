import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

// 결과 파일을 저장할 디렉토리
const RESULTS_DIR = path.join(process.cwd(), 'public', 'results');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 파일명과 형식 가져오기
    const { fileName, format } = req.query;

    if (!fileName || !format) {
      return res.status(400).json({ error: '파일명과 형식이 필요합니다.' });
    }

    if (typeof fileName !== 'string' || typeof format !== 'string') {
      return res
        .status(400)
        .json({ error: '파일명과 형식은 문자열이어야 합니다.' });
    }

    if (!['pdf', 'docx'].includes(format)) {
      return res.status(400).json({ error: '지원하지 않는 형식입니다.' });
    }

    // 파일 경로 생성 - 전체 파일명을 직접 사용
    const filePath = path.join(RESULTS_DIR, fileName);

    // 파일 존재 확인
    try {
      await fsPromises.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // Content-Type 설정
    let contentType = 'application/octet-stream';
    if (format === 'pdf') {
      contentType = 'application/pdf';
    } else if (format === 'docx') {
      contentType =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // 파일 통계 정보 가져오기
    const stats = await fsPromises.stat(filePath);

    // 파일명 인코딩 및 헤더 처리를 위한 준비
    const encodedFilename = encodeURIComponent(fileName);
    // ASCII 문자만 포함된 기본 파일명 (안전한 헤더 값을 위해)
    const safeFileName = `translated_file.${format}`;

    // 향상된 헤더 설정
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    
    // 안전한 Content-Disposition 헤더 설정
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFilename}`
    );

    // 캐시 컨트롤 헤더
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // 단순화된 파일 다운로드 처리: 테스트 코드와 동일한 방식 
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
    }
  }
}
