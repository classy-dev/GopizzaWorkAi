import { PassThrough } from 'stream';
import axios from 'axios';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} from 'docx';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';

interface SaveFileRequest {
  text: string;
  format: 'pdf' | 'docx' | 'txt';
  originalFileName?: string; // 원본 파일명 (선택 사항)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 요청 데이터 파싱
    const { text, format, originalFileName }: SaveFileRequest = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '저장할 텍스트가 없습니다.' });
    }

    // 고유 파일 ID 생성
    const fileId = uuidv4();

    // 파일명 생성 로직 개선
    let baseFileName = 'translated'; // 기본값

    // 원본 파일명이 제공된 경우 사용
    if (originalFileName) {
      // 원본 파일명에서 확장자 제거
      baseFileName = originalFileName.replace(/\.[^/.]+$/, '');

      // 파일명에 사용할 수 없는 문자 제거
      baseFileName = baseFileName.replace(/[\\/:*?"<>|]/g, '_');
    }

    // 최종 파일명: "원본파일명_번역_짧은ID"
    const shortId = fileId.substring(0, 6); // ID의 앞 6자리만 사용
    const fileName = `${baseFileName}_번역_${shortId}`;
    const fullFileName = `${fileName}.${format}`;

    try {
      // 포맷에 따라 메모리에 파일 생성 후 직접 전송
      if (format === 'pdf') {
        const pdfBuffer = await generatePDFInMemory(text);

        // PDF 파일 직접 전송
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(fullFileName)}`
        );
        return res.send(pdfBuffer);
      } else if (format === 'docx') {
        const docxBuffer = await generateDOCXInMemory(text);

        // DOCX 파일 직접 전송
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(fullFileName)}`
        );
        return res.send(docxBuffer);
      } else if (format === 'txt') {
        // TXT 파일 생성 - HTML 태그 제거하고 순수 텍스트만 저장
        const cleanText = await generateTXTContent(text);

        // TXT 파일 직접 전송
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(fullFileName)}`
        );
        return res.send(cleanText);
      } else {
        return res.status(400).json({ error: '지원하지 않는 형식입니다.' });
      }
    } catch (processingError) {
      console.error(
        `${format.toUpperCase()} 파일 생성 중 오류:`,
        processingError
      );
      return res.status(500).json({
        error: `${format.toUpperCase()} 문서 생성 중 오류: ${processingError instanceof Error ? processingError.message : '알 수 없는 오류'}`,
      });
    }
  } catch (error) {
    console.error('파일 처리 중 오류:', error);
    res
      .status(500)
      .json({ error: '서버 오류: 문서 처리 중 문제가 발생했습니다.' });
  }
}

// 메모리에 PDF 생성
async function generatePDFInMemory(text: string): Promise<Buffer> {
  try {
    // 텍스트 정제 - 네모 문자(□) 및 기타 제어 문자 제거 (줄바꿈 유지)
    const cleanText = text
      .replace(/[\u25A1\u25A0\u2610\u2611\u2612]/g, '') // 네모 문자 제거
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거 (줄바꿈, 탭 제외)
      .replace(/\uFFFD/g, ''); // 대체 문자 제거

    // jsDelivr CDN에서 Noto Sans KR 폰트 가져오기 (안정적인 CDN)
    const fontUrl =
      'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@4.5.0/files/noto-sans-kr-korean-400-normal.woff';

    // 폰트 가져오기
    let fontBuffer: Buffer | null = null;
    try {
      const fontResponse = await axios.get(fontUrl, {
        responseType: 'arraybuffer',
      });
      fontBuffer = Buffer.from(fontResponse.data);
      console.log('한글 폰트 다운로드 성공');
    } catch (fontError) {
      console.error('한글 폰트 다운로드 실패:', fontError);
      fontBuffer = null;
    }

    // PDF 문서 생성
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: '번역 결과',
        Author: 'PDF Global Translate Web',
        Subject: '번역된 문서',
      },
    });

    // 버퍼 생성
    const buffers: Buffer[] = [];

    // 스트림 설정 - PassThrough 사용
    const stream = new PassThrough();
    doc.pipe(stream);

    stream.on('data', chunk => {
      buffers.push(Buffer.from(chunk));
    });

    // 다운로드한 폰트 사용
    if (fontBuffer) {
      try {
        doc.font(fontBuffer);
        console.log('한글 폰트 로드 성공');
      } catch (error) {
        console.error('한글 폰트 로드 실패:', error);
        doc.font('Helvetica'); // 폰트 로드 실패 시 기본 폰트 사용
      }
    } else {
      console.log('한글 폰트를 사용할 수 없습니다. 기본 폰트를 사용합니다.');
      doc.font('Helvetica');
    }

    // PDF 내용 작성
    // PDF 제목 추가
    doc.fontSize(20).fillColor('#333333').text('번역 결과', {
      align: 'center',
    });

    // 생성 날짜 추가
    doc
      .fontSize(10)
      .fillColor('#666666')
      .text(`생성 시간: ${new Date().toLocaleString('ko-KR')}`, {
        align: 'right',
      });

    // 구분선 추가
    doc.moveDown(2);
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke('#cccccc');
    doc.moveDown(2);

    // 본문 내용 추가
    doc.fontSize(12).fillColor('#000000');

    // 텍스트 행으로 분할 (빈 줄도 보존하여 문단 구분 유지)
    const paragraphs = cleanText.split('\n').map(p => p.trim()); // 각 줄의 앞뒤 공백만 제거하고 빈 줄은 유지

    // <br> 태그 처리 함수
    const processBrTagsForText = (text: string): string[] => {
      // <br> 태그로 텍스트 분할
      return text.split(/<br\s*\/?>/i);
    };

    // 각 문단 처리 (문단 사이 간격 추가)
    let emptyLineCount = 0;

    paragraphs.forEach((paragraph, index) => {
      // 빈 줄은 문단 구분으로 처리
      if (paragraph === '') {
        emptyLineCount++;
        // 연속된 빈 줄은 최대 1개만 적용 (과도한 공백 방지)
        if (emptyLineCount <= 1) {
          doc.moveDown(1.5); // 빈 줄에는 더 큰 간격 적용
        }
        return;
      }

      // 일반 텍스트 줄 처리
      emptyLineCount = 0;

      // <br> 태그가 있는 경우 분할하여 각각 처리
      const lines = processBrTagsForText(paragraph);

      lines.forEach((line, i) => {
        // 각 줄에 대한 처리
        doc.text(line, {
          align: 'left',
          lineGap: 7, // 줄 간격 증가
          paragraphGap: i < lines.length - 1 ? 5 : 10, // 마지막 줄이 아니면 더 작은 간격
          continued: i < lines.length - 1, // 마지막 줄이 아니면 연속 모드
        });

        if (i < lines.length - 1) {
          doc.moveDown(0.5); // <br> 태그로 분할된 줄 사이에 작은 간격 추가
        }
      });

      // 짧은 텍스트(5단어 미만)는 제목으로 간주하고 추가 공백 적용
      const wordCount = paragraph.split(/\s+/).length;
      if (wordCount < 5 && paragraph.length < 50) {
        doc.moveDown(0.5); // 제목 다음에 약간의 추가 공간
      }
    });

    // PDF 문서 종료
    doc.end();

    return new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      stream.on('error', err => {
        reject(err);
      });
    });
  } catch (error) {
    console.error('PDF 생성 중 오류 발생:', error);
    throw error;
  }
}

// 메모리에 DOCX 생성
async function generateDOCXInMemory(text: string): Promise<Buffer> {
  try {
    // 텍스트 정제 - 네모 문자(□) 및 기타 제어 문자 제거 (줄바꿈 유지)
    const cleanText = text
      .replace(/[\u25A1\u25A0\u2610\u2611\u2612]/g, '') // 네모 문자 제거
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거 (줄바꿈, 탭 제외)
      .replace(/\uFFFD/g, ''); // 대체 문자 제거

    // 페이지 번호 구분자와 일반 텍스트로 분리
    const { paragraphs, pageMarkers } = processTextWithPageNumbers(cleanText);

    // 문서 생성
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: buildDocumentChildren(paragraphs, pageMarkers),
        },
      ],
    });

    // DOCX 파일로 변환하여 메모리에 저장
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  } catch (error) {
    console.error('DOCX 생성 중 오류 발생:', error);
    throw new Error('DOCX 파일 생성에 실패했습니다.');
  }
}

/**
 * 텍스트에서 페이지 번호 구분자 추출 및 처리
 * @param text 원본 텍스트
 * @returns 처리된 문단 및 페이지 마커 정보
 */
function processTextWithPageNumbers(text: string): {
  paragraphs: string[];
  pageMarkers: { index: number; pageNum: number }[];
} {
  const paragraphs = text.split('\n');
  const pageMarkers: { index: number; pageNum: number }[] = [];

  // 페이지 번호 구분자 감지
  for (let i = 0; i < paragraphs.length; i++) {
    const match = paragraphs[i].match(/\[PAGE_NUMBER:(\d+)\]/);
    if (match) {
      pageMarkers.push({ index: i, pageNum: parseInt(match[1]) });
      // 구분자 텍스트 제거
      paragraphs[i] = '';
    }
  }

  return { paragraphs, pageMarkers };
}

/**
 * 문서 자식 요소(단락) 생성
 * @param paragraphs 텍스트 문단 배열
 * @param pageMarkers 페이지 번호 마커 정보
 * @returns 문서 자식 요소 배열
 */
function buildDocumentChildren(
  paragraphs: string[],
  pageMarkers: { index: number; pageNum: number }[]
): Paragraph[] {
  const children: Paragraph[] = [];

  // 문서 제목
  children.push(
    new Paragraph({
      text: '', // 텍스트 필드는 비우고 children만 사용
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 300,
      },
      children: [
        new TextRun({
          text: '번역 결과',
          size: 36, // 18pt
          bold: true,
        }),
      ],
    })
  );

  // 날짜 정보
  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: {
        after: 300,
      },
      children: [
        new TextRun({
          text: `생성 시간: ${new Date().toLocaleString('ko-KR')}`,
          size: 20, // 10pt
        }),
      ],
    })
  );

  // 페이지 번호 그룹화 - 인접한 인덱스의 페이지 번호 모으기
  const groupedPageMarkers: { startIndex: number; pageNums: number[] }[] = [];
  let currentGroup: { startIndex: number; pageNums: number[] } | null = null;

  pageMarkers.sort((a, b) => a.index - b.index); // 인덱스 순으로 정렬

  pageMarkers.forEach(marker => {
    if (!currentGroup) {
      // 첫 그룹 시작
      currentGroup = { startIndex: marker.index, pageNums: [marker.pageNum] };
    } else if (marker.index - currentGroup.startIndex <= 2) {
      // 현재 그룹과 인접한 경우 (최대 2개 인덱스 차이까지 허용) - 같은 그룹으로 처리
      currentGroup.pageNums.push(marker.pageNum);
    } else {
      // 새 그룹 시작
      groupedPageMarkers.push(currentGroup);
      currentGroup = { startIndex: marker.index, pageNums: [marker.pageNum] };
    }
  });

  // 마지막 그룹 추가
  if (currentGroup) {
    groupedPageMarkers.push(currentGroup);
  }

  // 각 문단 및 그룹화된 페이지 번호 처리
  let lastProcessedIndex = -1;

  for (let i = 0; i < paragraphs.length; i++) {
    // 이미 처리된 인덱스는 건너뛰기
    if (i <= lastProcessedIndex) continue;

    // 현재 위치에 페이지 번호 그룹이 있는지 확인
    const pageGroup = groupedPageMarkers.find(group => group.startIndex === i);

    if (pageGroup) {
      // 페이지 번호 단락 추가 (콤마로 구분된 형식)
      const pageText =
        pageGroup.pageNums.length > 1
          ? `원본 페이지: ${pageGroup.pageNums.join(', ')}`
          : `원본 페이지: ${pageGroup.pageNums[0]}`;

      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: {
            before: 240, // 12pt
            after: 120, // 6pt
          },
          children: [
            new TextRun({
              text: pageText,
              size: 20, // 10pt
              color: '666666',
            }),
          ],
        })
      );

      // 그룹의 마지막 인덱스까지 처리된 것으로 표시
      lastProcessedIndex = pageGroup.startIndex;
    }

    // 일반 텍스트 단락 추가 (비어있지 않은 경우)
    if (paragraphs[i].trim()) {
      // <br> 태그 처리를 위해 텍스트를 분할하여 처리
      const segments = processBrTags(paragraphs[i]);

      children.push(
        new Paragraph({
          children: segments, // 원본 텍스트 대신 <br> 태그가 처리된 segments 사용
          spacing: {
            line: 360, // 1.5배 줄간격
            before: 120,
            after: 120,
          },
        })
      );
    }
  }

  return children;
}

/**
 * <br> 태그를 줄바꿈으로 처리하여 TextRun 배열로 반환
 * @param text 처리할 텍스트
 * @returns TextRun 객체 배열
 */
function processBrTags(text: string): TextRun[] {
  // <br> 태그로 텍스트 분할
  const parts = text.split(/<br\s*\/?>/i);
  const result: TextRun[] = [];

  // 각 부분을 TextRun으로 변환
  parts.forEach((part, index) => {
    if (part) {
      result.push(
        new TextRun({
          text: part,
          size: 24, // 12pt
        })
      );
    }

    // 마지막 요소가 아니면 줄바꿈 추가
    if (index < parts.length - 1) {
      result.push(
        new TextRun({
          text: '',
          break: 1, // 줄바꿈 추가
        })
      );
    }
  });

  return result;
}

/**
 * TXT 파일 내용 생성 - HTML 태그 제거
 * @param text 원본 텍스트
 * @returns 정제된 텍스트
 */
async function generateTXTContent(text: string): Promise<string> {
  try {
    // HTML 태그 제거 (단, <br> 태그는 줄바꿈으로 변환)
    const cleanText = text
      // <br> 태그를 줄바꿈으로 변환
      .replace(/<br\s*\/?>/gi, '\n')
      // 나머지 HTML 태그 제거
      .replace(/<[^>]*>/g, '')
      // HTML 엔티티 변환
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      // 연속된 줄바꿈 최적화 (최대 2개로 제한)
      .replace(/\n{3,}/g, '\n\n')
      // 줄 앞뒤 공백 제거
      .split('\n')
      .map(line => line.trim())
      .join('\n');

    return cleanText;
  } catch (error) {
    console.error('TXT 파일 생성 중 오류 발생:', error);
    throw new Error('TXT 파일 생성에 실패했습니다.');
  }
}
