import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * 변환된 파일 다운로드 API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const { file } = req.query;

    if (!file || Array.isArray(file)) {
      return res.status(400).json({ error: '유효한 파일명이 제공되지 않았습니다.' });
    }

    // 보안을 위해 파일명 검증 (경로 조작 방지)
    const fileName = path.basename(file);
    
    // 파일 경로 설정
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);

    // 파일 존재 여부 확인
    try {
      await fsPromises.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 파일 정보 가져오기
    const stat = await fsPromises.stat(filePath);

    // 다운로드를 위한 헤더 설정
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Length', stat.size);

    // 파일 스트림 생성 및 응답에 파이프
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('파일 다운로드 오류:', error);
    return res.status(500).json({
      error: `파일 다운로드 중 오류 발생: ${error.message}`
    });
  }
}
