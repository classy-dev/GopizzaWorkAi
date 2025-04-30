import HTMLtoDOCX from 'html-to-docx';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

/**
 * 문서 가독성 향상을 위한 HTML 전처리 함수
 * - 문단 여백 및 줄간격 개선
 * - 헤딩 태그 포맷팅
 * - 특수 요소 스타일링
 * - 페이지 번호 표시 (PDF 파일의 경우)
 */

// API 요청 크기 제한 설정 (Next.js API 설정)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // API 요청 크기 제한 증가
    },
  },
};

function enhanceDocument(
  html: string,
  showPageNumbers: boolean = false
): string {
  // 페이지 번호 스타일 개선 (PDF 파일인 경우)
  if (showPageNumbers) {
    html = html.replace(
      /<div class="page-number".*?>원본 페이지: (\d+)<\/div>/g,
      '<div class="page-number" style="text-align: right; font-size: 10pt; color: #666; margin: 10px 0; padding-bottom: 3px; border-bottom: 1px solid #eee;">원본 페이지: $1</div>'
    );
  }

  // 전체 문서에 기본 스타일 적용 (폰트 크기 등)
  const wrappedHtml = `<div style="font-family: 'Malgun Gothic'; line-height: 1.5;">${html}</div>`;

  return (
    wrappedHtml
      // 기본 문단 스타일링
      .replace(/<p>/g, '<p style="line-height: 1.5;font-size: 14pt;">')

      // 헤딩 스타일링
      .replace(
        /<h1>/gi,
        '<h1 style="margin-top: 2em; margin-bottom: 1em; font-size: 18pt; font-weight: bold;">'
      )
      .replace(
        /<h2>/gi,
        '<h2 style="margin-top: 1.8em; margin-bottom: 0.8em; font-size: 16pt; font-weight: bold;">'
      )
      .replace(
        /<h3>/gi,
        '<h3 style="margin-top: 1.5em; margin-bottom: 0.7em; font-size: 14pt; font-weight: bold;">'
      )
      .replace(
        /<h4>/gi,
        '<h4 style="margin-top: 1.3em; margin-bottom: 0.6em; font-size: 14pt; font-weight: bold;">'
      )
      .replace(
        /<h5>/gi,
        '<h5 style="margin-top: 1.2em; margin-bottom: 0.5em; font-size: 14pt; font-weight: bold;">'
      )
      .replace(
        /<h6>/gi,
        '<h6 style="margin-top: 1.1em; margin-bottom: 0.5em; font-size: 14pt; font-weight: bold;">'
      )

      // 리스트 스타일링
      .replace(
        /<ul>/gi,
        '<ul style="margin-left: 2em; margin-bottom: 1em; font-size: 14pt;">'
      )
      .replace(
        /<ol>/gi,
        '<ol style="margin-left: 2em; margin-bottom: 1em; font-size: 14pt;">'
      )
      .replace(/<li>/gi, '<li style="margin-bottom: 0.3em; font-size: 14pt;">')

      // 블록 요소 스타일링
      .replace(
        /<blockquote>/gi,
        '<blockquote style="margin: 1em 0; padding-left: 1em; border-left: 3px solid #ccc; font-style: italic; font-size: 14pt;">'
      )

      // 문서 간격 개선
      .replace(/(<\/p>)(\s*)(<p)/gi, '$1\n\n$3')
      .replace(/(<\/h[1-6]>)(\s*)(<[ph])/gi, '$1\n\n$3')
  );
}

/**
 * 표 스타일링 개선 함수
 */
function enhanceTable(html: string): string {
  // 표 기본 스타일 적용
  let result = html.replace(
    /<table>/gi,
    '<table style="width:100%; border-collapse:collapse; margin-top:1.5em; margin-bottom:1.5em;">'
  );

  // 기본 셀 스타일링
  result = result.replace(
    /<td>/gi,
    `<td style="font-family: 'Malgun Gothic';padding:8px; border:1px solid #ddd; vertical-align:middle;font-size: 13pt;">`
  );

  // 기존 테이블 헤더 스타일링
  result = result.replace(
    /<th>/gi,
    `<th style="font-family: 'Malgun Gothic';padding:10px; border:1px solid #ddd; background-color:#f2f2f2; font-weight:bold; text-align:center;font-size: 13pt;">`
  );

  // <th> 태그가 없는 경우, 첫 행을 헤더로 변환
  if (!/<th/i.test(result)) {
    result = result.replace(
      /(<table[^>]*>(?:\s*<tbody>)?\s*<tr[^>]*>)((?:\s*<td[^>]*>.*?<\/td>)+)(<\/tr>)/i,
      (
        match: string,
        tableStart: string,
        cells: string,
        rowEnd: string
      ): string => {
        // td를 th로 변환
        const headerCells = cells.replace(
          /<td([^>]*)>(.*?)<\/td>/gi,
          `<th style="font-family: 'Malgun Gothic';padding:10px; border:1px solid #ddd; background-color:#f2f2f2; font-weight:bold; text-align:center;">$2</th>`
        );
        return tableStart + headerCells + rowEnd;
      }
    );
  }

  return result;
}

/**
 * HTML을 DOCX로 변환하는 API
 * 서버리스 환경에 최적화된 직접 다운로드 방식
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const {
      html,
      fileName = 'translated_document.docx',
      showPageNumbers = 'false',
    } = req.body;

    if (!html) {
      return res
        .status(400)
        .json({ error: 'HTML 콘텐츠가 제공되지 않았습니다.' });
    }

    // 파일명 중복 방지를 위한 고유 ID 생성
    const uniqueFileName = `${fileName.replace(/\.docx$/, '')}_${uuidv4().substring(0, 8)}.docx`;

    // showPageNumbers 문자열을 불리언으로 변환
    const shouldShowPageNumbers = showPageNumbers === 'true';

    // HTML 문서 전처리
    console.log('HTML 문서 가독성 개선 시작...');

    // 특수 구분자로 표시된 페이지 번호를 스타일이 적용된 텍스트로 변환
    let processedHtml = html;

    // 간격 태그 변환 (<br> 태그를 <p> 태그로 변환)
    processedHtml = processedHtml.replace(/<br\s*\/?>/g, '<p>&nbsp;</p>');

    // 문서 가독성 개선 적용
    processedHtml = enhanceDocument(processedHtml, shouldShowPageNumbers);

    // 2. 표 있는지 확인
    const hasTable = /<table/i.test(processedHtml);
    console.log('테이블 감지:', hasTable ? '있음' : '없음');

    if (hasTable) {
      console.log('테이블 강화 스타일 적용');
      processedHtml = enhanceTable(processedHtml);
    }

    // HTMLtoDOCX 옵션 설정 - 가독성 및 스타일링 개선
    const options = {
      title: uniqueFileName,
      // 페이지 여백 설정
      margins: {
        top: 1440, // 1인치
        right: 1440, // 1인치
        bottom: 1440, // 1인치
        left: 1440, // 1인치
      },
      // 폰트 설정 - HIP(Half of point) 단위 사용
      // 14pt를 얻으려면 28로 설정 (2배 값)
      font: 'Malgun Gothic', // 한글 지원 폰트
      fontSize: 28, // 14pt에 해당 (HIP 단위)

      // 문단 스타일링
      paragraph: {
        spacing: {
          line: 360, // 1.5배 줄간격 유지
          before: 240, // 단락 전 여백
          after: 240, // 단락 후 여백
        },
      },

      // 테이블 스타일링
      table: {
        row: { cantSplit: true }, // 행 분리 방지
        cell: {
          margins: {
            top: 120, // 셀 내부 상단 여백
            bottom: 120, // 셀 내부 하단 여백
            left: 180, // 셀 내부 좌측 여백
            right: 180, // 셀 내부 우측 여백
          },
        },
      },

      // 목록 스타일링
      numbering: {
        defineNumberingStyle: true,
      },

      header: false,
      footer: false,
    };

    console.log('HTML을 DOCX로 변환 시작');

    // HTML을 DOCX로 변환
    const docxBuffer = await HTMLtoDOCX(processedHtml, options);
    console.log(`DOCX 변환 완료: ${docxBuffer.length} 바이트`);

    // 브라우저가 파일 다운로드로 인식하도록 응답 헤더 설정
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${uniqueFileName}"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Length', docxBuffer.length);

    // DOCX 버퍼를 직접 응답으로 전송
    return res.send(docxBuffer);
  } catch (error: any) {
    console.error('DOCX 생성 오류:', error);
    return res.status(500).json({
      error: `DOCX 변환 중 오류 발생: ${error.message}`,
    });
  }
}
