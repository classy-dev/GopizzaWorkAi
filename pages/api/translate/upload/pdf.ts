import fs from 'fs';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';

// formidable을 사용하기 위해 body parser 비활성화
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    // formidable로 파일 업로드 처리
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB 제한 (Blob은 더 큰 파일 허용)
    });

    // 파일 파싱
    const [, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          resolve([fields, files]);
        });
      }
    );

    // 업로드된 파일 처리
    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: '파일이 업로드되지 않았습니다.' });
    }

    // 파일 정보 추출
    const originalFilename = file.originalFilename || 'document.pdf';
    const contentType = file.mimetype || 'application/pdf';
    
    // 파일 스트림 생성
    const fileStream = fs.createReadStream(file.filepath);
    
    // Vercel Blob에 업로드
    const blob = await put(originalFilename, fileStream, {
      access: 'public',
      contentType,
      addRandomSuffix: false, // 같은 이름의 파일 덮어쓰기
    });

    // 임시 파일 삭제
    try {
      fs.unlinkSync(file.filepath);
    } catch (cleanupError) {
      console.error('임시 파일 삭제 실패:', cleanupError);
    }

    // 업로드 성공 응답
    return res.status(200).json({
      success: true,
      blob,
      fileName: originalFilename,
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return res.status(500).json({ error: `파일 업로드 중 오류 발생: ${errorMessage}` });
  }
}
