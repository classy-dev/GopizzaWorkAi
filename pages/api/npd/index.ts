import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';
import { json } from 'stream/consumers';

interface NPDSearchRequest {
  query: string;
}

// Rate Limiter 클래스 구현 - 일정 시간 간격을 두고 API 호출
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
    const { query }: NPDSearchRequest = req.body as NPDSearchRequest;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: '검색어가 없습니다.' });
    }

    // console.log('NPD 검색 요청:', {
    //   user: session.user.name,
    //   query: query,
    // });

    // API 요청 전 rate limiting 적용
    await rateLimiter.wait();

    // Google Generative AI 초기화
    const genAI = new GoogleGenerativeAI(apiKey);

    // 모델 설정 - Grounding with Google Search 활성화
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-04-17',
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      tools: [{ googleSearch: {} } as any],
    });

    // 프롬프트 작성 (피자 신상품 개발에 초점)
    const prompt = `
    당신은 고피자(GOPIZZA) 회사의 NPD(New Development Product) 팀을 위한 리서치 어시스턴트입니다. 
    아래 검색어와 관련된 피자 트렌드, 경쟁사 제품, 시장 동향, 인기 토핑, 고객 선호도 등을 조사해야 합니다.
    
    검색어: "${query}"
    
    다음 형식으로 정보를 제공해주세요:
    
    1. 검색 결과 요약 (간략하게 핵심 정보 정리)
    2. 주요 발견점 (3-5개 불릿 포인트로 정리)
    3. 세부 정보 (관련 정보를 체계적으로 카테고리별로 정리)
    4. 신상품 개발 제안 (검색 결과를 바탕으로 한 아이디어나 방향성 제안)
    5. 정보 출처 (검색된 정보의 출처 링크, 현재 날짜 기준 최신 정보 위주)
    
    모든 정보는 제품 개발팀이 활용할 수 있도록 실용적이고 명확하게 제공해주세요.
    한국어로 응답해주세요.
  `;

    // API 호출
    console.log('Gemini API 호출 시작...');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    const searchResult = response.text();

    // 출처 URL 추출
    interface SourceUrl {
      url: string;
      title: string;
    }

    const sourceUrls: SourceUrl[] = [];

    try {
      // 응답 객체에서 JSON 데이터 추출 (stringify한 후 다시 parse)
      const rawJson = JSON.stringify(response);
      const responseData = JSON.parse(rawJson);

      // API 응답에서 groundingChunks 배열 확인
      if (response?.candidates?.[0].groundingMetadata?.groundingChunks?.[0]) {
        // 각 청크에서 URL 추출
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;

        const seenUrls = new Set<string>(); // 중복 URL 제거를 위한 Set

        chunks.forEach((chunk: any) => {
          // searchSource 경로 추가하여 올바른 데이터 접근

          sourceUrls.push({
            url: chunk.web.uri,
            title: chunk.web.title || '참고 자료',
          });
          seenUrls.add(chunk.web.uri);
        });
      }
    } catch (error) {
      console.error('출처 URL 추출 오류:', error);
    }

    // 사용량 기록 로직 추가 (향후 구현 가능)
    // await prisma.apiUsage.create({
    //   data: {
    //     userId: session.user.id,
    //     apiType: 'npd_search',
    //     tokensUsed: estimateTokens(query + searchResult), // 토큰 수 추정 함수
    //     status: 'SUCCESS',
    //   },
    // });

    console.log('출처 URL:', sourceUrls);
    return res.status(200).json({
      result: searchResult,
      sources: sourceUrls,
    });
  } catch (error: any) {
    console.error('NPD 검색 오류:', error);

    // 오류 응답
    return res.status(500).json({
      error: error.message || '검색 처리 중 오류가 발생했습니다.',
    });
  }
}
