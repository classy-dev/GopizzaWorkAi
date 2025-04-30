import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';

// API 키는 환경 변수에서 가져올 것입니다
interface TranslateRequest {
  text: string;
  sourceLang: string;
  isKoreanSource?: boolean;
  targetLang?: string;
  isHtml?: boolean; // HTML 콘텐츠 여부 추가
  html?: string; // HTML 원본 코드 (테이블 등)
  structureType?: string; // 구조 타입 (table 등)
  documentType?: string; // 문서 타입 (docx, pdf, txt 등)
}

// Rate Limiter 클래스 구현
class RateLimiter {
  private lastRequestTime: number = 0;

  async wait() {
    const currentTime = Date.now() / 1000;
    const timeSinceLastRequest = currentTime - this.lastRequestTime;

    if (timeSinceLastRequest < 6) {
      // 6초 간격으로 조정 (분당 10회)
      await new Promise(resolve =>
        setTimeout(resolve, (6 - timeSinceLastRequest) * 1000)
      );
    }

    this.lastRequestTime = Date.now() / 1000;
  }
}

// 싱글톤 Rate Limiter 인스턴스
const rateLimiter = new RateLimiter();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 세션 확인 및 사용자 인증
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: '로그인이 필요한 서비스입니다.' });
    }

    // 사용자의 API 키 가져오기
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { apiKey: true },
    });

    // API 키 확인
    const apiKey = user?.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API 키가 설정되지 않았습니다.');
      return res.status(403).json({
        error: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
      });
    }

    // 요청 데이터 파싱
    const {
      text,
      sourceLang,
      isKoreanSource,
      targetLang,
      isHtml = false,
      html,
      structureType,
      documentType,
    }: TranslateRequest = req.body as TranslateRequest;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: '번역할 텍스트가 없습니다.' });
    }

    console.log('번역 요청:', {
      textLength: text.length,
      sourceLang,
      isHtml: isHtml ? 'HTML 콘텐츠' : '일반 텍스트',
      preview: text.substring(0, 100) + '...',
    });

    // API 요청 전 rate limiting 적용
    await rateLimiter.wait();

    // 소스 언어 처리
    let sourceLanguage = sourceLang;
    if (sourceLang.endsWith('어')) {
      sourceLanguage = sourceLang.slice(0, -1);
    }

    // Google Generative AI 초기화
    const genAI = new GoogleGenerativeAI(apiKey);

    // 파일 타입에 따른 시스템 지시사항 분기
    let systemInstruction = '';

    // 기본 지시사항 (모든 파일 타입에 공통 적용)
    const baseInstruction = `
      [지침]
      1.  **정확성 및 자연스러움**: 원문의 핵심 의미와 뉘앙스를 놓치지 않으면서, ${targetLang || '한국어'} 사용자에게 매우 자연스럽고 유창하게 읽히도록 번역해줘. 딱딱한 직역 투는 피하고, 의미가 명확히 전달되도록 필요하다면 어순이나 표현을 조절해줘.
      2.  **전문 용어 처리**: 영어로 된 전문 용어, 고유 명사, 브랜드명 (예: Python, Google Cloud, Coca-Cola)은 번역하지 말고 원문 그대로 유지해줘.
      3.  **내용 범위**: 원문의 모든 내용을 빠짐없이 번역해야 하며, 요약하거나 임의로 내용을 생략하지 마.
      4.  **불필요한 내용 추가 금지**: 원문에 없는 설명, 주석, 의견 등 어떤 추가 텍스트도 포함하지 마.
      5.  **문장 분리 (선택적)**: 원문의 문장이 ${targetLang || '한국어'}로 번역했을 때 지나치게 길어져 가독성을 해친다고 판단될 경우에만, 의미가 끊기지 않는 선에서 자연스럽게 1~2개의 문장으로 나눠줘. 하지만 무분별한 문장 나누기는 지양해야 해.
      6.  **특수 문자**: 원문의 □, ■ 와 같은 체크박스형 특수 문자는 번역 결과에서 제거해줘.
      7. 번역된 결과만 알려줘야지, 지침이나 형식설정이나 [반역] 같은 말머리나 기타 필요없는 텍스트는 넣지마. 또한 원문도 번역 결과에 포함하지 마. 완성된 번역본을 원해.

      [형식]
      1.  **문단 구조**: 원문의 문단 구조(단락 나눔)를 **절대 변경하지 말고 그대로 유지**해야 해.
      2.  **문단 구분**: 각 문단 사이에는 **반드시 빈 줄을 하나만 추가**해줘. (\`\\n\\n\` 형식)
      3.  **목록**: 불릿 포인트(•, -, * 등)로 시작하는 목록 항목은 번역 후에도 동일한 불릿 포인트를 사용하여 목록 형식을 유지해줘.
      4.  **기타 서식**: 원문의 줄바꿈(문단 내 줄바꿈 제외), 들여쓰기 등 기본적인 서식 특징이 있다면 최대한 보존하려고 노력해줘. (HTML 코드가 아닌 일반 텍스트 기준)
    `;

    // DOCX 파일용 추가 지시사항
    const docxInstruction = `
      [HTML 처리 규칙]
      1. HTML 코드가 주어진 경우 모든 HTML 태그(예: <table>, <tr>, <td>, <p>, <strong> 등)와 속성, 전체 구조는 절대로 변경하거나 제거하지 마세요.
      2. 사용자에게 보이는 텍스트 콘텐츠만 주어진 목표 언어로 번역해야 합니다.
      3. 번역 후에는 번역된 텍스트가 포함된 완전한 HTML 코드 문자열만 반환해야 합니다.
      4. 다른 부가적인 설명이나 마크다운 형식(\`\`\`html ... \`\`\`) 없이 순수한 HTML 코드만 반환하세요.
      5. HTML 코드 구조는 100% 동일하게 유지하면서 내용만 번역합니다.
    `;

    // documentType이 요청에 포함되어 있는지 확인하고 파일 타입에 따라 지시사항 설정
    if (documentType === 'docx') {
      systemInstruction = baseInstruction + docxInstruction;
    } else {
      // PDF, TXT 등 다른 파일 타입은 기본 지시사항만 적용
      systemInstruction = baseInstruction;
    }

    // 모델 및 설정
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp-01-21',
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.5,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });

    console.log('Gemini API 호출 시작...', { documentType });

    // HTML 콘텐츠인 경우 처리
    if (isHtml) {
      console.log('HTML 콘텐츠 번역 모드 시작');

      // 테이블 처리 - HTML이 제공되었는지 확인
      const htmlContent = html || text;

      if (!htmlContent) {
        return res.status(400).json({
          error: 'HTML 콘텐츠가 제공되지 않았습니다.',
        });
      }

      // 테이블 전체를 한번에 번역하는 프롬프트
      const tablePrompt = `
        다음 HTML 코드의 내용을 ${targetLang || '한국어'}로 번역해주세요. 
        HTML 태그 구조는 절대 변경하지 말고, 텍스트 내용만 번역해주세요.
        HTML 태그 내의 텍스트 콘텐츠만 번역하고, 태그 자체(<table>, <tr>, <td> 등)는 그대로 유지해주세요.
        번역 결과로는 전체 HTML 코드만 반환해주세요(마크다운이나 코드 블록 없이).
        
        ${htmlContent}
        `;

      console.log('HTML 번역 프롬프트 생성 완료, API 호출...');
      const result = await model.generateContent(tablePrompt);
      const response = await result.response;
      let translatedHtml = response.text().trim();

      // 결과 정제 (마크다운 코드 블록이나 추가 텍스트가 있을 경우 제거)
      if (translatedHtml.includes('```html')) {
        translatedHtml = translatedHtml
          .replace(/```html/g, '')
          .replace(/```/g, '')
          .trim();
      }

      if (translatedHtml.includes('```')) {
        translatedHtml = translatedHtml.replace(/```/g, '').trim();
      }

      // HTML 태그 시작과 끝 확인 (옵션)
      if (!translatedHtml.startsWith('<') && htmlContent.startsWith('<')) {
        console.warn(
          '번역 결과가 HTML 태그로 시작하지 않습니다. 원본 구조가 손상되었을 수 있습니다.'
        );
      }

      console.log('HTML 번역 완료:', {
        translatedHtmlLength: translatedHtml.length,
        preview: translatedHtml.substring(0, 100) + '...',
      });

      // 결과 반환
      return res.status(200).json({
        success: true,
        translatedText: translatedHtml,
        originalText: htmlContent,
        sourceLang: sourceLang,
        isHtml: true,
      });
    }

    // 일반 텍스트 처리 (수정된 로직)
    // Gemini API 호출
    const prompt = `
      
      원본 텍스트:
      ${text}
      `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let translatedText = response.text().trim();

    console.log('원본 API 응답:', translatedText);

    try {
      // 텍스트: 키워드 이후의 내용만 추출
      if (translatedText.includes('텍스트:')) {
        const textParts = translatedText.split('텍스트:');
        if (textParts.length > 1 && textParts[1].trim()) {
          translatedText = textParts[1].trim();
          console.log('텍스트: 키워드 이후 추출된 내용:', translatedText);
        }
      }

      // Text: 키워드 이후의 내용만 추출 (영어 프롬프트인 경우)
      else if (translatedText.includes('Text:')) {
        const textParts = translatedText.split('Text:');
        if (textParts.length > 1 && textParts[1].trim()) {
          translatedText = textParts[1].trim();
          console.log('Text: 키워드 이후 추출된 내용:', translatedText);
        }
      }
    } catch (extractError) {
      console.error('텍스트 추출 중 오류:', extractError);
      // 텍스트 추출에 실패하면 원본 텍스트 사용
      console.log('텍스트 추출 실패, 원본 응답 사용');
    }

    console.log('Gemini API 응답 처리 완료:', {
      translatedTextLength: translatedText.length,
      preview: translatedText.substring(0, 100) + '...',
    });

    // 원본 텍스트가 "청크"로 제공되었는지 확인 - 중요
    const isChunkRequest = req.body.isChunk === true;

    // 응답 반환
    return res.status(200).json({
      success: true,
      translatedText: translatedText,
      originalText: text, // 원본 텍스트 그대로 반환
      sourceLang: sourceLang,
    });
  } catch (error) {
    console.error('번역 중 오류:', error);
    res.status(500).json({
      error:
        '서버 오류: 번역 중 문제가 발생했습니다.' +
        (error instanceof Error ? ' - ' + error.message : ''),
    });
  }
}
