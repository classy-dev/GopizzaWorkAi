import path from 'path';
import mammoth from 'mammoth';
import { NextApiRequest, NextApiResponse } from 'next';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { getPdfWorkerPath } from './pdf-worker-setup';

// Next.js API 응답 크기 제한 설정 (16MB로 증가)
export const config = {
  api: {
    responseLimit: '16mb',
  },
};

// Node.js 환경에서 pdfjsLib worker 설정
if (typeof window === 'undefined') {
  // 서버사이드에서만 실행
  // Vercel 서버리스 환경에서는 fake worker 모드 사용
  pdfjsLib.GlobalWorkerOptions.workerSrc = getPdfWorkerPath();
}

// 문서 타입 정의
type DocumentType = 'pdf' | 'docx' | 'txt' | 'unknown';

/**
 * 페이지별 텍스트 인터페이스
 */
interface PageTextContent {
  page: number;
  text: string;
}

/**
 * Blob URL에서 문서를 추출하는 API 핸들러
 * /api/translate/document/extract 대신 사용할 수 있는 대체 API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    // 요청에서 Blob URL과 파일 이름 가져오기
    const { blobUrl, fileName } = req.body;

    if (!blobUrl) {
      return res.status(400).json({ error: 'Blob URL이 제공되지 않았습니다.' });
    }

    // Blob URL에서 파일 가져오기
    const fileResponse = await fetch(blobUrl);
    if (!fileResponse.ok) {
      return res.status(500).json({
        error: `Blob에서 파일을 가져오는 중 오류가 발생했습니다. 상태 코드: ${fileResponse.status}`,
      });
    }

    // 파일 데이터를 ArrayBuffer로 변환
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileType = getDocumentType(fileName || '');

    // 텍스트 추출
    let extractedText = '';
    let pages = 1;
    let htmlContent = ''; // 추가: HTML 콘텐츠를 저장할 변수
    let pageTextContents: PageTextContent[] = []; // PDF 페이지별 텍스트를 저장할 변수 추가

    try {
      if (fileType === 'pdf') {
        // PDF 파일 처리
        console.log('[PDF 처리] PDF 문서 로드 시작');
        const pdfDocument = await pdfjsLib.getDocument({
          data: new Uint8Array(fileBuffer),
          // Vercel 서버리스 환경에서는 GlobalWorkerOptions.workerSrc = '' 설정으로 
          // 내부적으로 fake worker 모드 사용
        }).promise;

        const numPages = pdfDocument.numPages;
        console.log(`[PDF 처리] 총 ${numPages}페이지 감지됨`);

        // 페이지별 텍스트 추출
        pageTextContents = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          
          // 텍스트 항목을 위치 기반으로 정렬하기 위한 배열
          const textItems: { 
            text: string, 
            x: number, 
            y: number, 
            height: number, 
            width: number 
          }[] = [];
          
          // 각 텍스트 항목의 위치 정보 수집
          for (const item of textContent.items) {
            if ('str' in item && item.str.trim()) {
              // PDF 좌표계는 왼쪽 하단이 원점이므로, Y 값이 클수록 페이지 상단에 위치
              const transform = item.transform || [1, 0, 0, 1, 0, 0];
              textItems.push({
                text: item.str,
                x: transform[4], // x 위치
                y: transform[5], // y 위치
                height: item.height || 0,
                width: item.width || 0
              });
            }
          }
          
          // 페이지 정보 필터링을 위한 준비
          // 페이지 치수 정보 가져오기
          const viewport = page.getViewport({ scale: 1.0 });
          const pageHeight = viewport.height;
          const pageWidth = viewport.width;
          
          // 페이지 상단/하단 영역 결정 (페이지 높이의 상위 10%, 하위 10% 정도)
          const topMarginPercent = 0.10; // 상단 10%
          const bottomMarginPercent = 0.10; // 하단 10%
          const leftMarginPercent = 0.10; // 왼쪽 10%
          const rightMarginPercent = 0.10; // 오른쪽 10%
          
          // 페이지 마진 영역 계산
          const topMarginY = pageHeight * (1 - topMarginPercent); // PDF 좌표계에서 Y는 아래에서 위로 증가
          const bottomMarginY = pageHeight * bottomMarginPercent;
          const leftMarginX = pageWidth * leftMarginPercent;
          const rightMarginX = pageWidth * (1 - rightMarginPercent);
          
          // 옵션: 페이지 번호 및 헤더/푸터 필터링 여부
          const filterHeaderFooter = true; // 이 옵션을 통해 필터링 기능을 켜고 끌 수 있음
          
          // 필터링된 텍스트 항목 준비
          let filteredTextItems = textItems;
          
          if (filterHeaderFooter) {
            // 페이지 상단과 하단의 텍스트 필터링
            filteredTextItems = textItems.filter(item => {
              // 헤더 또는 푸터 영역에 있는 텍스트 제외
              const isInHeader = item.y > topMarginY;
              const isInFooter = item.y < bottomMarginY;
              const isInLeftMargin = item.x < leftMarginX;
              const isInRightMargin = item.x > rightMarginX;
              
              // 특정 패턴의 텍스트 검사 (페이지 번호, 날짜 등)
              const isPageNumberPattern = /^\d+$/.test(item.text.trim()) || // 단순 숫자
                                          /^Page \d+$|^\d+ of \d+$/i.test(item.text.trim()) || // "Page X" 또는 "X of Y" 패턴
                                          /^[0-9]+$/.test(item.text.trim()); // 숫자만
              
              // 헤더/푸터 영역에 있고, 짧은 텍스트(페이지 번호 등으로 추정)는 제외
              const isHeaderFooterText = (isInHeader || isInFooter) && 
                                        (item.text.length < 15 || isPageNumberPattern);
              
              // 제외하지 않을 텍스트만 반환
              return !isHeaderFooterText;
            });
          }
          
          // Y 좌표로 먼저 정렬 (위에서 아래로), 같은 Y 값이면 X 좌표로 정렬 (왼쪽에서 오른쪽으로)
          filteredTextItems.sort((a, b) => {
            // 같은 줄로 간주할 수 있는 Y 값 차이 (텍스트 높이의 절반 정도)
            const sameLine = Math.abs(a.y - b.y) < (a.height + b.height) / 4;
            
            if (sameLine) {
              // 같은 줄이면 X 좌표로 정렬
              return a.x - b.x;
            } else {
              // 다른 줄이면 Y 좌표로 정렬 (PDF에서는 Y 좌표가 클수록 위쪽)
              return b.y - a.y;
            }
          });
          
          // 정렬된 텍스트 항목을 줄 단위로 그룹화하여 텍스트 재구성
          let pageText = '';
          let currentLineY = -1;
          
          for (const item of filteredTextItems) {
            const isNewLine = currentLineY === -1 || 
                              Math.abs(item.y - currentLineY) > (item.height / 2);
            
            if (isNewLine && pageText) {
              pageText += '\n';
            }
            
            pageText += item.text + ' ';
            currentLineY = item.y;
          }
          
          pageTextContents.push({
            page: i,  // 페이지 번호를 명시적으로 설정
            text: pageText.trim()
          });

          console.log(`[PDF 처리] 페이지 ${i} 텍스트 추출 완료: ${pageText.length}자`);
        }
        
        // 추출된 페이지별 텍스트를 전체 텍스트로 병합
        extractedText = pageTextContents
          .map(page => page.text)
          .join('\n\n');
        
        pages = pdfDocument.numPages;
        
      } else if (fileType === 'docx') {
        // DOCX 파일 처리
        const result = await mammoth.convertToHtml({
          buffer: Buffer.from(fileBuffer),
        });
        
        // HTML 콘텐츠 저장
        htmlContent = result.value || '';
        
        // 테이블 구조 최적화 - 헤더 인식 개선
        htmlContent = optimizeTableStructure(htmlContent);
        
        // 기존 호환성을 위해 HTML에서 텍스트 추출 (태그 제거)
        extractedText = htmlContent.replace(/<[^>]*>/g, ' ').trim();
      } else if (fileType === 'txt') {
        // TXT 파일 처리
        const textDecoder = new TextDecoder('utf-8');
        extractedText = textDecoder.decode(fileBuffer);
      } else {
        throw new Error('지원되지 않는 파일 형식입니다.');
      }
    } catch (extractError) {
      console.error('텍스트 추출 오류:', extractError);
      return res.status(500).json({
        error: '문서에서 텍스트를 추출하는 중 오류가 발생했습니다.',
      });
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
      // PDF의 경우 이제 페이지별로 정확한 텍스트 정보가 있음
      if (typeof pageTextContents !== 'undefined' && pageTextContents.length > 0) {
        // pdfjs-dist로 추출한 페이지별 텍스트 사용
        for (const pageContent of pageTextContents) {
          textWithPages.push({
            text: pageContent.text,
            pageNum: pageContent.page,
          });
        }
      } else {
        // 기존 페이지 추정 로직은 백업으로 유지
        const avgPageLength = Math.ceil(extractedText.length / pages);
        const paragraphs = extractedText.split(/\n\s*\n/);
        const paragraphsPerPage = Math.ceil(paragraphs.length / pages);

        for (let i = 0; i < pages; i++) {
          const startIdx = i * paragraphsPerPage;
          const endIdx = Math.min((i + 1) * paragraphsPerPage, paragraphs.length);
          const pageText = paragraphs.slice(startIdx, endIdx).join('\n\n');

          if (pageText.trim()) {
            textWithPages.push({
              text: pageText.trim(),
              pageNum: i + 1,
            });
          }
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
      fileName: fileName || 'document',
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
function getDocumentType(fileName: string): DocumentType {
  const ext = path.extname(fileName).toLowerCase();

  if (ext === '.pdf') {
    return 'pdf';
  } else if (ext === '.docx') {
    return 'docx';
  } else if (ext === '.txt') {
    return 'txt';
  }

  return 'unknown';
}

/**
 * DOCX에서 변환된 HTML 테이블 구조를 최적화합니다.
 * <td><p><strong> 패턴을 <th> 태그로 변환하고, <td><p> 패턴을 간소화하여 테이블 헤더를 올바르게 인식하도록 합니다.
 */
function optimizeTableStructure(htmlContent: string): string {
  // <td><p><strong> 패턴을 <th> 태그로 변환
  htmlContent = htmlContent.replace(/<td><p><strong>/g, '<th>');
  
  // </strong></p></td> 패턴을 </th>로 변환
  htmlContent = htmlContent.replace(/<\/strong><\/p><\/td>/g, '</th>');
  
  // <td><p> 패턴을 간소화
  htmlContent = htmlContent.replace(/<td><p>/g, '<td>');
  
  // </p></td> 패턴을 </td>로 변환
  htmlContent = htmlContent.replace(/<\/p><\/td>/g, '</td>');
  
  return htmlContent;
}
