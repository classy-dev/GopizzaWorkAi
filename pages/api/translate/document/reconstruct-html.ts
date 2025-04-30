import { JSDOM } from 'jsdom';
import { NextApiRequest, NextApiResponse } from 'next';

interface ChunkWithStructure {
  id: string;
  translatedText: string;
  structurePath?: string;
  structureType?: 'text' | 'table-cell';
}

/**
 * HTML 재구성 API
 * 번역된 텍스트를 원본 HTML 구조에 삽입
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const { html, chunks } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML 콘텐츠가 제공되지 않았습니다.' });
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: '번역된 청크가 제공되지 않았습니다.' });
    }

    // 구조 정보가 있는 청크만 필터링
    const structuredChunks = chunks.filter(
      (chunk) => chunk.structurePath && chunk.structureType
    ) as ChunkWithStructure[];

    if (structuredChunks.length === 0) {
      console.warn('구조 정보가 있는 번역된 청크가 없습니다.');
      return res.status(200).json({
        success: true,
        html: html, // 구조 정보가 없으면 원본 HTML 반환
        message: '구조 정보가 있는 번역된 청크가 없어 원본 HTML을 반환합니다.'
      });
    }

    // HTML 파싱
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log(`${structuredChunks.length}개의 구조화된 청크로 HTML 재구성 시작`);

    // 각 청크를 해당 위치에 삽입
    let updatedCount = 0;

    structuredChunks.forEach(chunk => {
      try {
        // 구조 경로를 이용해 요소 찾기
        if (chunk.structurePath) {
          const element = document.querySelector(chunk.structurePath);
          
          if (element) {
            // 요소의 텍스트 콘텐츠 교체
            element.textContent = chunk.translatedText;
            updatedCount++;
          } else {
            console.warn(`경로 ${chunk.structurePath}에 해당하는 요소를 찾을 수 없습니다.`);
          }
        }
      } catch (error) {
        console.error(`청크 ${chunk.id} 처리 중 오류:`, error);
      }
    });

    console.log(`HTML 재구성 완료: ${updatedCount}/${structuredChunks.length} 청크 업데이트됨`);

    // HTML 직렬화
    const updatedHtml = dom.serialize();

    // 결과 반환
    return res.status(200).json({
      success: true,
      html: updatedHtml,
      updatedCount
    });
  } catch (error: any) {
    console.error('HTML 재구성 오류:', error);
    return res.status(500).json({
      error: `HTML 재구성 중 오류 발생: ${error.message}`
    });
  }
}
