import * as fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import { NextApiRequest, NextApiResponse } from 'next';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Node.js 환경에서 pdfjsLib worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = ''; // 서버 사이드에서는 worker 필요 없음

// formidable options 정의
export const config = {
  api: {
    bodyParser: false, // 파일 업로드를 위해 body parser 비활성화
  },
};

// 임시 파일 저장 디렉토리 (로컬 개발용)
const UPLOAD_DIR = path.join(process.cwd(), 'tmp');

// PDF 페이지 인터페이스
interface PDFPage {
  text: string;
  pageNum: number;
}

/**
 * PDF 파일에서 텍스트 추출 API 핸들러
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

    // PDF 파일 확인
    if (file.mimetype !== 'application/pdf') {
      // 임시 파일 삭제 (로컬 개발 환경에서만)
      if (isLocal && fs.existsSync(file.filepath)) {
        fs.unlinkSync(file.filepath);
      }
      return res.status(400).json({ error: 'Uploaded file is not a PDF' });
    }

    // 페이지별 텍스트를 저장할 배열
    const pages: PDFPage[] = [];

    // 전체 PDF 문서 처리 (페이지 수 확인용)
    const pdfDoc = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
    const pageCount = pdfDoc.numPages;

    console.log(`PDF 페이지 수: ${pageCount}`);

    // 페이지별로 텍스트 추출
    for (let i = 1; i <= pageCount; i++) {
      try {
        // pdfjsLib에서는 페이지별 텍스트 추출을 직접적으로 지원
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        // str 속성이 있는 항목만 처리하여 안전하게 텍스트 추출
        let pageText = '';
        for (const item of textContent.items) {
          if ('str' in item) {
            pageText += item.str + ' ';
          }
        }
        
        pages.push({
          text: pageText.trim(),
          pageNum: i,
        });

        console.log(
          `페이지 ${i} 처리 완료: 텍스트 길이 = ${pageText.length}자`
        );
      } catch (pageError) {
        console.error(`페이지 처리 중 오류:`, pageError);
        // 오류가 발생해도 빈 페이지로 처리하여 계속 진행
        pages.push({
          text: '',
          pageNum: i,
        });
      }
    }

    // 임시 파일 삭제 (로컬 개발 환경에서만)
    if (isLocal && fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }

    // 성공 응답
    console.log(
      `[PDF 추출 디버깅] 응답 페이지 데이터:`,
      pages.map(p => ({ pageNum: p.pageNum, textLength: p.text.length }))
    );

    return res.status(200).json({
      success: true,
      fileName: file.originalFilename || 'document.pdf',
      fileSize: file.size,
      pages: pages.length,
      textWithPages: pages,
    });
  } catch (error: unknown) {
    console.error('PDF 처리 오류:', error);
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';
    return res.status(500).json({
      error: `PDF 텍스트 추출 중 오류 발생: ${errorMessage}`,
    });
  }
}
