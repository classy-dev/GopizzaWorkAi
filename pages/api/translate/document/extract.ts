import * as fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import mammoth from 'mammoth';
import { NextApiRequest, NextApiResponse } from 'next';
import pdfParse from 'pdf-parse';

// formidable options 정의
export const config = {
  api: {
    bodyParser: false, // 파일 업로드를 위해 body parser 비활성화
  },
};

// 임시 파일 저장 디렉토리 (로컬 개발용)
const UPLOAD_DIR = path.join(process.cwd(), 'tmp');

// 문서 타입 정의
type DocumentType = 'pdf' | 'docx' | 'unknown';

/**
 * 문서 파일에서 텍스트 추출 API 핸들러
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 업로드 디렉토리 확인/생성 (로컬 개발용)
    const isLocal = process.env.NODE_ENV === 'development';
    if (isLocal && !fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // formidable 파일 업로드 처리
    const form = formidable({
      uploadDir: isLocal ? UPLOAD_DIR : undefined,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // 20MB 제한
    });

    // 파일 업로드 처리 및 파싱
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
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 버퍼 준비
    let fileBuffer: Buffer;
    
    if (isLocal) {
      // 로컬 개발 환경에서는 파일시스템 사용
      fileBuffer = fs.readFileSync(file.filepath);
    } else {
      // Vercel 환경에서는 메모리에서 바로 처리
      fileBuffer = await fs.promises.readFile(file.filepath);
    }

    // 파일 타입 확인
    const fileName = file.originalFilename || 'document';
    const fileType = getDocumentType(file.mimetype || '', fileName);

    // 텍스트 추출
    let extractedText = '';
    let pages = 1;
    let htmlContent = ''; // 추가: HTML 콘텐츠를 저장할 변수

    try {
      if (fileType === 'pdf') {
        // PDF 파일 처리
        const data = await pdfParse(fileBuffer);
        extractedText = data.text || '';
        pages = data.numpages || 1;
      } else if (fileType === 'docx') {
        // DOCX 파일 처리
        const result = await mammoth.convertToHtml({
          buffer: fileBuffer,
        });
        
        // HTML 콘텐츠 저장
        htmlContent = result.value || '';
        
        // 기존 호환성을 위해 HTML에서 텍스트 추출 (태그 제거)
        extractedText = htmlContent.replace(/<[^>]*>/g, ' ').trim();
      } else {
        throw new Error('지원되지 않는 파일 형식입니다.');
      }
    } catch (extractError) {
      console.error('텍스트 추출 오류:', extractError);
      // 임시 파일 삭제 (로컬 개발 환경에서만)
      if (isLocal && fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
      return res.status(500).json({
        error: '문서에서 텍스트를 추출하는 중 오류가 발생했습니다.',
      });
    }

    // 임시 파일 삭제 (로컬 개발 환경에서만)
    if (isLocal && fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // 텍스트가 없으면 오류
    if (!extractedText.trim()) {
      return res.status(400).json({
        error: '문서에서 텍스트를 추출할 수 없습니다. 파일을 확인해주세요.',
      });
    }

    // 텍스트를 페이지별로 나누기 (DOCX는 한 페이지로 처리)
    const textWithPages = [];
    if (fileType === 'pdf' && pages > 1) {
      // PDF의 경우 페이지를 추정하여 분할
      // 참고: 이 방식은 완벽하지 않으며, 더 정확한 페이지 분할은 향후 개선 필요

      // 평균 페이지 길이 계산
      const avgPageLength = Math.ceil(extractedText.length / pages);

      // 빈 줄을 기준으로 텍스트 분할
      const paragraphs = extractedText.split(/\n\s*\n/);
      const paragraphsPerPage = Math.ceil(paragraphs.length / pages);

      for (let i = 0; i < pages; i++) {
        const startIdx = i * paragraphsPerPage;
        const endIdx = Math.min(
          (i + 1) * paragraphsPerPage,
          paragraphs.length
        );
        const pageText = paragraphs.slice(startIdx, endIdx).join('\n\n');

        if (pageText.trim()) {
          textWithPages.push({
            text: pageText.trim(),
            pageNum: i + 1,
          });
        }
      }
    } else {
      // DOCX 또는 단일 페이지 PDF의 경우
      textWithPages.push({
        text: extractedText.trim(),
        pageNum: 1,
        // DOCX 파일인 경우에만 HTML 콘텐츠 추가
        ...(fileType === 'docx' ? { html: htmlContent } : {})
      });
    }

    // 성공 응답
    return res.status(200).json({
      success: true,
      fileName,
      fileSize: file.size,
      fileType,
      pages: textWithPages.length,
      textWithPages,
    });
  } catch (error: unknown) {
    console.error('문서 처리 오류:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';
    return res.status(500).json({
      error: `문서 텍스트 추출 중 오류 발생: ${errorMessage}`,
    });
  }
}

/**
 * 파일 정보를 기반으로 문서 타입 결정
 */
function getDocumentType(
  mimeType: string,
  fileName: string
): DocumentType {
  if (
    mimeType === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf')
  ) {
    return 'pdf';
  } else if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.toLowerCase().endsWith('.docx')
  ) {
    return 'docx';
  }
  return 'unknown';
}
