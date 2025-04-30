import * as cheerio from 'cheerio';
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

// 일반 텍스트 청크 최대 크기 (글자 수)
const MAX_TEXT_CHUNK_SIZE = 5000;

// API 요청 크기 제한 설정 (Next.js API 설정)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // API 요청 크기 제한 증가
    },
  },
};

interface DocumentChunk {
  id: string;
  text: string;
  pages: number[];
  html?: string;
  structureType: 'text' | 'table' | 'image';
  startPosition?: number;
  endPosition?: number;
}

// 순서를 추적하기 위한 요소 인터페이스
interface DocumentElement {
  type: 'text' | 'table' | 'image';
  content: string;
  html?: string;
  position: number;
  alt?: string; // 이미지용
}

/**
 * HTML 문서 분석 API
 * 테이블과 일반 텍스트를 구분하여 청크 생성
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const { html } = req.body;

    if (!html) {
      return res
        .status(400)
        .json({ error: 'HTML 콘텐츠가 제공되지 않았습니다.' });
    }

    // HTML 분석 및 청크 생성
    const chunks = analyzeHtml(html);

    return res.status(200).json({
      success: true,
      chunks,
    });
  } catch (error: any) {
    console.error('HTML 분석 오류:', error);
    return res.status(500).json({
      error: `HTML 분석 중 오류 발생: ${error.message}`,
    });
  }
}

/**
 * HTML 문서 분석 및 청크 생성 - Cheerio 사용 최적화 버전
 * 문서 요소 순서 보존하면서 연속된 텍스트 요소 병합
 * @param html HTML 문서
 * @returns 생성된 청크 배열
 */
function analyzeHtml(html: string): DocumentChunk[] {
  console.time('analyzeHtml');

  // Cheerio 로드
  const $ = cheerio.load(html);

  // 루트 요소에서 텍스트, 테이블, 이미지 추출
  const bodyContent = $('body').html() || '';

  // 결과 청크 배열
  const chunks: DocumentChunk[] = [];

  // HTML 내용을 텍스트 블록, 테이블, 이미지 섹션으로 분할
  const sectionsWithTypes = splitHtmlIntoSections($, bodyContent);

  // 섹션 배열을 순회하며 청크 생성
  let position = 0;
  sectionsWithTypes.forEach(section => {
    if (section.type === 'table') {
      // 테이블은 단일 청크로
      chunks.push({
        id: uuidv4(),
        text: section.text.trim(),
        html: section.html,
        pages: [1], // 기본값
        structureType: 'table',
        startPosition: position,
        endPosition: position + (section.html?.length || 0),
      });
      position += section.html?.length || 0;
    } else if (section.type === 'image') {
      // 이미지는 단일 청크로
      chunks.push({
        id: uuidv4(),
        text: section.alt || '이미지',
        html: section.html,
        pages: [1], // 기본값
        structureType: 'image',
        startPosition: position,
        endPosition: position + (section.html?.length || 0),
      });
      position += section.html?.length || 0;
    } else if (section.type === 'text' && section.text.trim()) {
      // 텍스트는 MAX_TEXT_CHUNK_SIZE에 따라 분할
      const textChunks = splitTextIntoChunks(
        section.text.trim(),
        MAX_TEXT_CHUNK_SIZE
      );

      let offset = 0;
      textChunks.forEach(chunkText => {
        chunks.push({
          id: uuidv4(),
          text: chunkText,
          pages: [1], // 기본값
          structureType: 'text',
          startPosition: position + offset,
          endPosition: position + offset + chunkText.length,
        });
        offset += chunkText.length;
      });

      position += section.text.length;
    }
  });

  console.timeEnd('analyzeHtml');
  console.log(`생성된 총 청크 수: ${chunks.length}`);
  return chunks;
}

/**
 * HTML 콘텐츠를 텍스트, 테이블, 이미지 섹션으로 분할
 */
function splitHtmlIntoSections(
  $: cheerio.CheerioAPI,
  htmlContent: string
): Array<{
  type: 'text' | 'table' | 'image';
  text: string;
  html?: string;
  alt?: string;
}> {
  const sections: Array<{
    type: 'text' | 'table' | 'image';
    text: string;
    html?: string;
    alt?: string;
  }> = [];

  // 임시 래퍼로 HTML 로드 (분석용)
  const $content = cheerio.load(
    `<div id="content-wrapper">${htmlContent}</div>`
  );
  const $wrapper = $content('#content-wrapper');

  // 현재 진행 중인 텍스트 섹션
  let currentTextBuffer = '';

  // 모든 최상위 자식 노드 순회
  $wrapper.contents().each((_: number, node: any) => {
    const $node = $content(node);

    // 테이블 검출
    if (node.tagName?.toLowerCase() === 'table') {
      // 현재 텍스트 버퍼가 있으면 먼저 추가
      if (currentTextBuffer.trim()) {
        sections.push({
          type: 'text',
          text: currentTextBuffer,
        });
        currentTextBuffer = '';
      }

      const tableHtml = $node.toString();
      const tableText = $node.text();

      if (tableText.trim()) {
        sections.push({
          type: 'table',
          text: tableText,
          html: tableHtml,
        });
      }
      return;
    }

    // 이미지 검출
    if (node.tagName?.toLowerCase() === 'img' || $node.find('img').length > 0) {
      const $img =
        node.tagName?.toLowerCase() === 'img'
          ? $node
          : $node.find('img').first();
      const imgHtml = $img.toString();
      const altText = $img.attr('alt') || '이미지';

      // 현재 텍스트 버퍼가 있으면 먼저 추가
      if (currentTextBuffer.trim()) {
        sections.push({
          type: 'text',
          text: currentTextBuffer,
        });
        currentTextBuffer = '';
      }

      sections.push({
        type: 'image',
        text: altText,
        html: imgHtml,
        alt: altText,
      });
      return;
    }

    // 나머지 텍스트 콘텐츠는 버퍼에 누적
    const text = $node.text().trim();
    if (text) {
      currentTextBuffer += (currentTextBuffer ? ' ' : '') + text;
    }
  });

  // 마지막 텍스트 버퍼 처리
  if (currentTextBuffer.trim()) {
    sections.push({
      type: 'text',
      text: currentTextBuffer,
    });
  }

  return sections;
}

/**
 * 텍스트를 글자 수 기준으로 분할
 * 가능한 문장 단위로 분할하려고 시도
 */
function splitTextIntoChunks(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];

  // 문장 단위로 분할 시도
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .filter(s => s.trim().length > 0);

  let currentChunk = '';

  for (const sentence of sentences) {
    // 단일 문장이 최대 크기보다 크면
    if (sentence.length > maxSize) {
      // 현재 누적된 청크가 있으면 추가
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // 긴 문장은 단어 단위로 분할
      const words = sentence.split(/\s+/);
      currentChunk = '';

      for (const word of words) {
        // 단일 단어가 maxSize보다 크면 글자 단위로 분할
        if (word.length > maxSize) {
          if (currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }

          // 긴 단어를 글자 단위로 분할
          for (let i = 0; i < word.length; i += maxSize) {
            chunks.push(word.substring(i, Math.min(i + maxSize, word.length)));
          }
        } else if (currentChunk.length + word.length + 1 > maxSize) {
          // 현재 청크에 단어 추가시 최대 크기 초과하면 청크 완성
          chunks.push(currentChunk.trim());
          currentChunk = word;
        } else {
          // 현재 청크에 단어 추가
          currentChunk += (currentChunk ? ' ' : '') + word;
        }
      }

      // 마지막 부분 처리
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    } else if (currentChunk.length + sentence.length + 1 > maxSize) {
      // 현재 청크에 문장 추가시 최대 크기 초과하면 청크 완성
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      // 현재 청크에 문장 추가
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  // 마지막 청크 처리
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
