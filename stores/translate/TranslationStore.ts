import { makeAutoObservable } from 'mobx';
import RootStore from './RootStore';
import { DocumentChunk } from './DocumentStore';

export interface TranslatedChunk extends DocumentChunk {
  translatedText: string;
  translatedHtml?: string; // 번역된 HTML 콘텐츠 (테이블 구조 등)
}

interface TranslationProgress {
  [key: string]: boolean; // 페이지 번호: 번역 완료 여부
}

/**
 * 번역 관련 상태와 로직을 관리하는 스토어
 * DocumentStore와 밀접한 관계가 있으며, DocumentStore에서 생성한 텍스트 청크를 번역하는 역할 담당
 */
export class TranslationStore {
  rootStore: RootStore;
  translatedChunks: TranslatedChunk[] = [];
  translatingChunk: DocumentChunk | null = null;
  translationInProgress = false;
  isKoreanSource = true;
  sourceLang = 'ko';
  targetLang = 'en';
  textareaText = '';
  translatedText = '';
  translationProgress = 0;
  progressCounter = 0; // 번역 진행 카운터
  totalChunks = 0; // 전체 청크 수
  translationApiInterval = 1000; // API 호출 간격(ms)
  translationApiRetryCount = 0; // API 재시도 횟수
  lastApiCallTime = 0; // 마지막 API 호출 시간
  lastTextApiCallTime = 0; // 마지막 텍스트 API 호출 시간
  lastError: Date | null = null; // 마지막 오류 발생 시간
  private translationProgress_: TranslationProgress = {}; // 페이지별 번역 진행 상태

  // 번역 관련 상태
  currentTranslationIndex: number = 0;
  isTranslating: boolean = false;
  translatedPages: TranslationProgress = {};
  outputFormat: 'pdf' | 'docx' = 'pdf';
  saveFormat: 'pdf' | 'docx' = 'pdf';

  // private helper: 번역 API 호출의 재시도 카운터
  private abortController: AbortController | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  /**
   * 번역된 청크 배열 직접 설정
   * @param chunks 번역된 청크 배열
   */
  setTranslatedChunks = (chunks: TranslatedChunk[]) => {
    this.translatedChunks = chunks;
  };

  /**
   * 번역된 청크 추가 (중복 방지)
   * 청크 ID 또는 텍스트+페이지 정보를 기준으로 중복 여부 확인
   * @param translatedChunk 추가할 번역된 청크
   */
  addTranslatedChunk = (translatedChunk: TranslatedChunk) => {
    if (!translatedChunk || !translatedChunk.text) {
      console.warn('유효하지 않은 청크가 추가 시도됨');
      return;
    }

    // 중복 확인을 위한 ID 기반 검색
    const existingIndex = this.translatedChunks.findIndex(
      existing =>
        // 1. ID가 있는 경우 ID로 비교 (가장 정확한 비교 방법)
        (translatedChunk.id && existing.id === translatedChunk.id) ||
        // 2. ID가 없는 경우 텍스트와 페이지 정보로 비교
        (existing.text === translatedChunk.text &&
          JSON.stringify(existing.pages) ===
            JSON.stringify(translatedChunk.pages))
    );

    // HTML 및 구조 관련 속성 포함 여부 확인
    const hasStructureInfo = translatedChunk.structureType === 'table';

    // 이미 있으면 교체, 없으면 추가
    if (existingIndex >= 0) {
      console.log(
        '기존 청크 업데이트:',
        existingIndex,
        '청크 ID:',
        translatedChunk.id,
        hasStructureInfo ? '(구조 정보 포함)' : ''
      );
      this.translatedChunks[existingIndex] = translatedChunk;
    } else {
      console.log(
        '새 청크 추가:',
        this.translatedChunks.length,
        '청크 ID:',
        translatedChunk.id,
        hasStructureInfo ? '(구조 정보 포함)' : ''
      );
      this.translatedChunks.push(translatedChunk);
    }

    // 번역된 페이지 정보 업데이트
    if (translatedChunk.pages && translatedChunk.pages.length > 0) {
      translatedChunk.pages.forEach(page => {
        // page가 유효한 값인지 확인하고 안전하게 문자열로 변환
        if (page !== undefined && page !== null) {
          const pageKey =
            typeof page === 'number' ? page.toString() : String(page);
          this.markPageAsTranslated(pageKey);
        }
      });
    }
  };

  /**
   * 현재 번역 중인 청크 인덱스 설정
   * @param index 인덱스 값
   */
  setCurrentTranslationIndex = (index: number) => {
    this.currentTranslationIndex = index;
  };

  /**
   * 번역 진행 중 상태 설정
   * @param isTranslating 번역 진행 중 여부
   */
  setIsTranslating = (isTranslating: boolean) => {
    this.isTranslating = isTranslating;
  };

  /**
   * 번역 진행률 설정
   * @param progress 진행률 (0-100)
   */
  setTranslationProgress = (progress: number) => {
    this.translationProgress = progress;
  };

  /**
   * 번역된 페이지 정보 설정
   * @param pages 페이지 번호와 번역 완료 여부 매핑
   */
  setTranslatedPages = (pages: TranslationProgress) => {
    this.translatedPages = pages;
  };

  /**
   * 특정 페이지를 번역 완료로 표시
   * @param pageNum 페이지 번호
   */
  markPageAsTranslated = (pageNum: string) => {
    this.translatedPages[pageNum] = true;
  };

  /**
   * 출력 형식 설정 (PDF/DOCX)
   * @param format 출력 형식
   */
  setOutputFormat = (format: 'pdf' | 'docx') => {
    this.outputFormat = format;
    this.saveFormat = format;
  };

  /**
   * 저장 형식 설정 (출력 형식과 동일하게 유지)
   * @param format 저장 형식
   */
  setSaveFormat = (format: 'pdf' | 'docx') => {
    this.setOutputFormat(format);
  };

  /**
   * 원본 언어 설정
   * @param lang 언어 코드
   */
  setSourceLang = (lang: string) => {
    this.sourceLang = lang;
  };

  /**
   * 번역 진행률 업데이트
   */
  updateTranslationProgress = () => {
    const { documentStore } = this.rootStore;
    if (documentStore.chunks.length > 0) {
      // 현재 번역 인덱스 기준으로 진행률 계산 (인덱스는 0부터 시작하므로 +1)
      this.progressCounter = this.currentTranslationIndex + 1;

      // 총 처리해야 할 청크 수 저장
      this.totalChunks = documentStore.chunks.length;

      // 진행률 계산
      this.translationProgress = Math.round(
        (this.progressCounter / this.totalChunks) * 100
      );

      console.log(
        `[진행률 업데이트] ${this.progressCounter}/${this.totalChunks} (${this.translationProgress}%), 현재 번역 인덱스: ${this.currentTranslationIndex}`
      );
    } else {
      this.translationProgress = 0;
      this.progressCounter = 0;
      this.totalChunks = 0;
    }
  };

  /**
   * 텍스트 청크를 번역 API에서 처리 가능한 크기로 확인 및 분할
   * 하나의 청크가 5000 크면 더 작은 청크로 분할
   */
  private ensureManageableChunkSize = (
    chunk: DocumentChunk,
    maxSize: number = 5000
  ): DocumentChunk[] => {
    if (chunk.text.length <= maxSize) {
      return [chunk];
    }

    console.log(
      `[번역 디버깅] 청크 크기 초과 (${chunk.text.length}자 > ${maxSize}자). 분할 시작...`
    );

    const splitChunks: DocumentChunk[] = [];
    const text = chunk.text;

    // 청크를 문장 단위로 분할 (좀 더 의미있는 단위)
    const sentences = text
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .filter(s => s.trim().length > 0);

    let currentChunk = '';
    let currentChunkId = 1;

    for (const sentence of sentences) {
      // 현재 문장을 추가했을 때 최대 크기를 초과하는지 확인
      if (
        currentChunk.length + sentence.length > maxSize &&
        currentChunk.length > 0
      ) {
        // 현재 청크를 저장하고 새 청크 시작
        splitChunks.push({
          id: `${chunk.id || 'chunk'}-split-${currentChunkId}`,
          text: currentChunk,
          pages: chunk.pages,
          structureType: chunk.structureType, // 원본 청크의 구조 유형 유지
        });

        currentChunk = '';
        currentChunkId++;
      }

      currentChunk += sentence + ' ';
    }

    // 마지막 청크 추가
    if (currentChunk.trim().length > 0) {
      splitChunks.push({
        id: `${chunk.id || 'chunk'}-split-${currentChunkId}`,
        text: currentChunk.trim(),
        pages: chunk.pages,
        structureType: chunk.structureType, // 원본 청크의 구조 유형 유지
      });
    }

    console.log(
      `[번역 디버깅] 청크 분할 완료. 1개 청크가 ${splitChunks.length}개로 분할됨.`
    );

    return splitChunks;
  };

  /**
   * 텍스트 번역 API 호출
   * @param text 번역할 텍스트
   * @param originalChunk 원본 청크 정보 (옵션)
   * @returns 번역된 텍스트
   */
  translateText = async (
    text: string,
    originalChunk?: DocumentChunk
  ): Promise<string> => {
    if (!text.trim()) {
      console.warn('번역할 텍스트가 없습니다.');
      return text;
    }

    // 디버깅 로그 추가: 번역 요청 시작 정보
    console.log('====== 번역 요청 시작 ======');
    console.log(`청크 ID: ${originalChunk?.id || '없음'}`);
    console.log(`텍스트 길이: ${text.length}자`);
    console.log(`텍스트 미리보기: ${text.substring(0, 100)}...`);
    console.log(`구조 타입: ${originalChunk?.structureType || '일반 텍스트'}`);
    console.log(
      `테이블 여부: ${originalChunk?.structureType === 'table' ? '네' : '아니오'}`
    );
    console.log(`HTML 존재 여부: ${originalChunk?.html ? '네' : '아니오'}`);
    console.log(`현재 번역 인덱스: ${this.currentTranslationIndex}`);
    console.log('==========================');

    const retryLimit = 3;
    let retryCount = 0;

    // 이미지 청크가 아닌 경우에만 API 호출 간격을 적용
    if (originalChunk?.structureType !== 'image') {
      // 직전 텍스트 API 호출과의 시간 간격 확인
      const currentTime = Date.now();
      const timeElapsed = currentTime - this.lastTextApiCallTime;
      if (timeElapsed < this.translationApiInterval) {
        const delay = this.translationApiInterval - timeElapsed;
        console.log(`${delay}ms 대기 후 텍스트 번역 시작...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // 이전 에러 발생 시간과 현재 시간 확인
      // 에러 발생 후 10초 이내에는 요청 빈도 감소
      const errorBackoff =
        this.lastError && Date.now() - this.lastError.getTime() < 10000;

      if (errorBackoff) {
        console.log('이전 오류로 인한 요청 간격 증가');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } else {
      console.log('이미지 청크: API 호출 간격 대기 건너뛰기');
    }

    // 구조 정보가 있는 콘텐츠인지 확인 (표 셀 등)
    const hasStructureInfo =
      originalChunk && originalChunk.structureType === 'table';
    const structureType = originalChunk?.structureType;

    try {
      // API 요청 정보 디버깅
      const requestData = {
        text,
        isKoreanSource: this.isKoreanSource,
        sourceLang: this.sourceLang,
        targetLang: this.targetLang, // 대상 언어 추가
        isChunk: true,
        structureType: structureType,
        isHtml: hasStructureInfo && structureType === 'table',
        html: hasStructureInfo && originalChunk?.html,
        documentType: this.rootStore.documentStore.documentType, // 문서 타입 추가
      };

      console.log(
        '📤 API 요청 데이터:',
        JSON.stringify(
          {
            isChunk: requestData.isChunk,
            sourceLang: requestData.sourceLang,
            targetLang: requestData.targetLang, // 로깅에도 추가
            isKoreanSource: requestData.isKoreanSource,
            isHtml: requestData.isHtml,
            structureType: requestData.structureType,
            documentType: requestData.documentType, // 로깅에도 추가
            textLength: requestData.text.length,
            textPreview: requestData.text.substring(0, 50) + '...',
            htmlLength: requestData.html ? String(requestData.html).length : 0,
          },
          null,
          2
        )
      );

      // 번역 API 호출
      const response = await fetch('/api/translate/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(
          `번역 요청 실패: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '번역에 실패했습니다.');
      }

      this.lastApiCallTime = Date.now();

      // 텍스트 청크인 경우 텍스트 API 호출 시간도 함께 업데이트
      if (originalChunk?.structureType !== 'image') {
        this.lastTextApiCallTime = this.lastApiCallTime;
      }
      this.translationApiRetryCount = 0;
      this.lastError = null;

      return data.translatedText || text;
    } catch (error) {
      this.lastError = new Date();
      retryCount++;
      this.translationApiRetryCount++;

      console.error('번역 중 오류:', error);

      // 오류가 발생했지만 재시도 횟수가 남아있는 경우
      if (retryCount <= retryLimit) {
        const retryDelay = 2000 * retryCount; // 점점 지연 시간 증가
        console.log(`${retryCount}번째 재시도, ${retryDelay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.translateText(text, originalChunk); // 재귀 호출로 재시도
      }

      // 재시도 횟수를 초과하면 원본 텍스트 반환
      console.error(`번역 재시도 횟수(${retryLimit})를 초과했습니다.`);
      return text;
    }
  };

  /**
   * 텍스트 청크 번역
   * @param chunk 번역할 텍스트 청크
   * @returns 번역된 청크
   */
  translateChunk = async (chunk: DocumentChunk): Promise<TranslatedChunk> => {
    // 구조적 정보가 있는지 확인
    const hasStructureInfo = !!chunk.structureType;

    try {
      // 이미지 청크는 번역 없이 그대로 반환
      if (chunk.structureType === 'image') {
        console.log(`이미지 청크 [${chunk.id}]: 번역 없이 유지`);

        // 이미지 청크는 번역하지 않고 그대로 반환
        return {
          ...chunk,
          translatedText: chunk.text, // 대체 텍스트 유지
          translatedHtml: chunk.html, // 이미지 HTML 유지
        };
      }

      // 번역 진행
      console.log(
        `청크 번역 시작 [${chunk.id}]:`,
        hasStructureInfo ? `(${chunk.structureType})` : '',
        chunk.text.substring(0, 30) + '...'
      );

      const translatedText = await this.translateText(chunk.text, chunk);

      // 번역된 청크 생성
      const translatedChunk: TranslatedChunk = {
        ...chunk,
        translatedText,
      };

      // HTML 정보가 있는 경우 HTML도 업데이트
      if (chunk.html) {
        // 간단히 HTML 내의 텍스트 부분만 교체 (복잡한 HTML 구조는 추후 구현)
        translatedChunk.translatedHtml = chunk.html;
      }

      return translatedChunk;
    } catch (error) {
      console.error('청크 번역 중 오류:', error);
      // 오류 발생 시 원본 텍스트 반환
      return {
        ...chunk,
        translatedText: chunk.text,
      };
    }
  };

  /**
   * 원본 텍스트 직접 번역
   * @param text 번역할 텍스트
   */
  translateDirectly = async (text: string): Promise<string> => {
    if (!text.trim()) {
      console.warn('번역할 텍스트가 없습니다.');
      return '';
    }

    try {
      // 가상 청크 생성
      const dummyChunk: DocumentChunk = {
        id: `direct-${Date.now()}`,
        text,
        pages: [1],
        structureType: 'text', // 직접 입력은 항상 텍스트 타입
      };

      // 번역 실행
      const translatedChunk = await this.translateChunk(dummyChunk);
      return translatedChunk.translatedText || '';
    } catch (error) {
      console.error('직접 번역 오류:', error);
      return '';
    }
  };

  /**
   * 모든 청크 번역 (일괄 처리)
   * DocumentStore의 모든 텍스트 청크를 순차적으로 번역
   */
  translateAllChunks = async () => {
    const { documentStore } = this.rootStore;
    const totalChunks = documentStore.chunks.length;

    if (totalChunks === 0) {
      console.warn('번역할 청크가 없습니다.');
      return;
    }

    this.isTranslating = true;
    this.currentTranslationIndex = 0;
    this.translationProgress = 0;

    try {
      console.log('일괄 번역 시작. 총 청크:', totalChunks);

      // 일괄 번역 시작
      for (let i = 0; i < totalChunks; i++) {
        if (!this.isTranslating) {
          console.log('번역이 중단되었습니다.');
          break;
        }

        await this.translateNextChunk();
      }

      console.log('모든 청크 번역 완료');
    } catch (err) {
      console.error('번역 중 오류 발생:', err);
      this.rootStore.uiStore.showSnackbar(
        '번역 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      this.isTranslating = false;
      // 최종 진행률 업데이트
      if (totalChunks > 0) {
        this.translationProgress =
          (this.translatedChunks.length / totalChunks) * 100;
      }
    }
  };

  /**
   * 다음 번역할 청크를 가져와 번역
   * @returns 더 번역할 청크가 있는지 여부
   */
  translateNextChunk = async (): Promise<boolean> => {
    // 더 이상 번역할 청크가 없거나 이미 번역 중인 경우 중단
    const { documentStore } = this.rootStore;

    try {
      // 번역 상태 확인 (외부에서 관리하므로 여기서 true로 설정하지 않음)
      // this.isTranslating = true;

      // 모든 청크가 번역되었는지 확인
      if (this.currentTranslationIndex >= documentStore.chunks.length) {
        console.log('[번역 디버깅] 모든 청크가 번역되었습니다.');
        return false;
      }

      // 현재 번역할 청크 가져오기
      const chunk = documentStore.chunks[this.currentTranslationIndex];

      // 이미 번역된 청크인지 확인
      const alreadyTranslated = this.translatedChunks.some(
        tc => tc.id === chunk.id
      );

      if (alreadyTranslated) {
        console.log(`[번역 디버깅] 이미 번역된 청크(${chunk.id}) 건너뛰기`);
        this.currentTranslationIndex++;
        return this.currentTranslationIndex < documentStore.chunks.length;
      }

      console.log(
        `[번역 디버깅] 청크 #${this.currentTranslationIndex + 1}/${documentStore.chunks.length} 번역 시작`
      );

      // 번역 시작
      const translatedChunk = await this.translateChunk(chunk);

      if (translatedChunk) {
        // 번역 성공 시 저장
        this.addTranslatedChunk(translatedChunk);

        // 진행률 업데이트
        this.updateTranslationProgress();
      } else {
        console.warn(`[번역 디버깅] 청크 ${chunk.id} 번역 실패 또는 건너뛰기`);
      }

      // 다음 청크로 이동
      this.currentTranslationIndex++;

      // 다음 번역 전 잠시 대기 (추가 보호)
      console.log(
        `[번역 지연] 다음 번역 요청 전 대기 중 (API 호출 간격: ${this.translationApiInterval / 1000}초)`
      );

      // 완료 후 상태 유지 (외부에서 관리하므로 여기서 false로 설정하지 않음)
      // this.isTranslating = false;

      return this.currentTranslationIndex < documentStore.chunks.length;
    } catch (error) {
      console.error('[번역 디버깅] 번역 중 오류 발생:', error);
      // 오류 발생 시에도 상태 유지
      // this.isTranslating = false;
      throw error;
    }
  };

  /**
   * 번역 결과를 저장 (내부용)
   * @deprecated saveTranslatedFile 사용 권장
   */
  saveTranslation = async () => {
    const { uiStore } = this.rootStore;

    if (this.translatedChunks.length === 0) {
      uiStore.showSnackbar('저장할 번역 내용이 없습니다.', 'warning');
      return;
    }

    try {
      // 번역된 텍스트를 하나의 문자열로 결합
      let combinedText = '';
      for (const chunk of this.translatedChunks) {
        if (chunk.pages.length) {
          const pageInfo = `원본 페이지: ${chunk.pages.join(', ')}`;
          combinedText += `${pageInfo}\n${chunk.translatedText}\n\n`;
        } else {
          combinedText += `${chunk.translatedText}\n\n`;
        }
      }

      // 실제 API 요청은 services 디렉토리의 API 함수를 사용하도록 변경 예정
      // const response = await saveTranslatedFile({
      //   text: combinedText,
      //   format: this.outputFormat
      // });

      // combinedText가 실제 API 요청에서 사용될 예정입니다.
      console.log('번역된 텍스트 준비 완료, 길이:', combinedText.length);

      // 임시 모의 응답
      await new Promise(resolve => setTimeout(resolve, 1000));

      uiStore.showSnackbar(
        `번역 결과가 ${this.outputFormat} 형식으로 저장되었습니다.`,
        'success'
      );
    } catch (err) {
      console.error('파일 저장 중 오류가 발생했습니다:', err);
      uiStore.showSnackbar('파일 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  /**
   * 번역된 파일 저장 및 다운로드
   * 번역 결과를 선택한 형식(PDF/DOCX)으로 저장하고 다운로드
   * @returns 성공 여부
   */
  saveTranslatedFile = async (): Promise<boolean> => {
    try {
      const { documentStore, uiStore } = this.rootStore;

      console.log(
        '저장 시도 중... 번역된 청크 수:',
        this.translatedChunks.length
      );

      if (this.translatedChunks.length === 0) {
        console.warn('번역된 내용이 없습니다. 저장을 중단합니다.');
        uiStore.showSnackbar('번역된 내용이 없습니다.', 'warning');
        return false;
      }

      // 번역된 내용을 텍스트로 변환 - 문제가 있는 특수 문자 필터링 추가
      let translatedContent = '';
      let hasHtmlContent = false;

      // 문서 유형이 PDF인지 확인
      const isPdfDocument = this.rootStore.documentStore.documentType === 'pdf';
      // 페이지 번호 표시 여부 확인
      const showPageNumbers = this.rootStore.documentStore.showPageNumbers;

      console.log(
        `문서 유형: ${this.rootStore.documentStore.documentType}, PDF 여부: ${isPdfDocument}, 페이지 번호 표시: ${showPageNumbers}`
      );
      console.log(`번역된 청크 수: ${this.translatedChunks.length}`);

      // 페이지 별로 청크 그룹화 (PDF 문서이고 페이지 번호 표시가 활성화된 경우)
      let currentPage = -1;

      // 청크별 형식 유지 처리
      this.translatedChunks.forEach((chunk, index) => {
        console.log(
          `변환 청크 #${index + 1}:`,
          chunk.id || '(ID 없음)',
          `(타입: ${chunk.structureType || '일반'})`,
          `(페이지: ${chunk.pages?.join(', ') || '정보 없음'})`,
          chunk.text?.substring(0, 30) + '...',
          '-> 번역:',
          (chunk.translatedText || '번역 없음').substring(0, 30) + '...'
        );

        // PDF 문서이고 페이지 정보가 있고 현재 페이지와 다른 경우 페이지 헤더 추가
        if (
          isPdfDocument &&
          showPageNumbers &&
          chunk.pages &&
          chunk.pages.length > 0
        ) {
          const chunkPage = chunk.pages[0];
          if (chunkPage !== currentPage) {
            // 새 페이지 시작
            currentPage = chunkPage;
            if (this.saveFormat === 'docx') {
              // HTML 태그 없이 일반 텍스트로 페이지 번호 표시 (특수 구분자 사용)
              translatedContent += `[PAGE_NUMBER:${currentPage}]\n`;
              console.log(`** 페이지 헤더 추가: 페이지 ${currentPage} **`);
            }
          }
        }

        // 기본 정제 - 일부 문제를 일으킬 수 있는 특수 문자 필터링
        let text = chunk.translatedText || '';
        text = text.replace(
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD\uFFFE\uFFFF]/g,
          ''
        );

        // 테이블 구조 및 HTML 처리
        if (chunk.structureType === 'table' && text) {
          // HTML 테이블 구조 보존
          console.log('테이블 구조 감지: HTML 형식 보존');

          // HTML 태그 확인
          if (!text.trim().toLowerCase().startsWith('<table')) {
            // 테이블 태그가 없는 경우 명시적으로 추가
            text = `<table>${text}</table>`;
          }

          translatedContent += text;
          hasHtmlContent = true;
        }
        // 이미지 처리
        else if (chunk.structureType === 'image' && chunk.html) {
          // 이미지 HTML 그대로 보존
          console.log('이미지 감지: 원본 HTML 형식 보존');

          // 이미지 HTML 추가
          translatedContent += chunk.html;
          hasHtmlContent = true;
        } else {
          // 일반 텍스트는 문단 구조를 보존하여 처리
          console.log('일반 텍스트 처리: 문단 구조 보존');

          // Gemini API의 \n\n\n 문단 구분 또는 일반 \n\n 문단 구분을 인식
          // 연속된 줄바꿈 2개 이상을 문단 구분으로 처리
          const paragraphs = text.split(/\n{2,}/);

          // 파일 타입에 따라 서식 적용 여부 결정
          const documentType = this.rootStore.documentStore.documentType;
          console.log('문서 파일 형식:', documentType);

          if (documentType === 'docx') {
            // 각 문단을 <p> 태그로 감싸 DOCX 형식에 맞게 처리
            const formattedParagraphs = paragraphs
              .filter(p => p.trim().length > 0) // 빈 문단 제거
              .map(p => {
                // 문단 내 줄바꿈 <br> 태그로 변환 (단일 줄바꿈)
                const withLineBreaks = p.trim().replace(/\n/g, '<br>\n');
                return `<p>${withLineBreaks}</p>`;
              });

            // 문단들을 결합하여 추가
            translatedContent += formattedParagraphs.join('\n');
            hasHtmlContent = true;
          } else {
            // TXT 또는 기타 형식은 일반 텍스트로 처리
            translatedContent += paragraphs.join('\n\n');
          }
        }

        // 청크 사이에 간격 추가 (필요한 경우)
        if (index < this.translatedChunks.length - 1) {
          if (this.saveFormat === 'docx') {
            // 간격을 추가하는 방식 변경 (HTML-to-DOCX 변환에 최적화된 형식)
            translatedContent += '<br />';
          } else {
            translatedContent += '\n\n';
          }
        }
      });

      // HTML 형식으로 감싸기
      translatedContent = `<div>${translatedContent}</div>`;

      console.log(
        '총 번역 텍스트 길이:',
        translatedContent.length,
        '(HTML 구조 포함:',
        hasHtmlContent ? 'O' : 'X',
        ')'
      );

      if (translatedContent.trim().length === 0) {
        console.warn('번역된 텍스트가 비어있습니다. 저장을 중단합니다.');
        uiStore.showSnackbar('번역된 텍스트가 비어있습니다.', 'warning');
        return false;
      }

      // 서버 API를 호출하여 PDF/DOCX 파일 생성
      try {
        // 로딩 상태 표시 (스낵바 사용)
        uiStore.showSnackbar('파일을 생성하는 중입니다...', 'info');

        // 숨겨진 iframe을 사용하여 파일 다운로드 (화면 깜빡임 방지)
        const iframeId = 'hidden-download-iframe';
        let iframe = document.getElementById(iframeId) as HTMLIFrameElement;

        // iframe이 없으면 생성
        if (!iframe) {
          iframe = document.createElement('iframe');
          iframe.id = iframeId;
          iframe.name = iframeId;
          iframe.style.display = 'none';
          document.body.appendChild(iframe);
        }

        // API 엔드포인트 선택 - HTML 구조가 있는 경우 generate-docx API 사용
        const apiEndpoint =
          hasHtmlContent && this.saveFormat === 'docx'
            ? '/api/translate/document/generate-docx'
            : '/api/translate/translation/save';

        console.log('선택된 API 엔드포인트:', apiEndpoint);

        // 폼 생성
        const form = document.createElement('form');
        form.action = apiEndpoint;
        form.method = 'POST';
        form.target = iframeId; // 숨겨진 iframe으로 응답 리다이렉트
        form.style.display = 'none';

        // HTML/텍스트 필드 추가 (API에 따라 필드명 다르게 설정)
        const contentField = document.createElement('input');
        contentField.type = 'hidden';
        contentField.name =
          hasHtmlContent && this.saveFormat === 'docx' ? 'html' : 'text';
        contentField.value = translatedContent;
        form.appendChild(contentField);

        // 포맷 필드 추가
        const formatField = document.createElement('input');
        formatField.type = 'hidden';
        formatField.name = 'format';
        formatField.value = this.saveFormat || 'docx';
        form.appendChild(formatField);

        // 원본 파일명 필드 추가
        const fileNameField = document.createElement('input');
        fileNameField.type = 'hidden';
        fileNameField.name =
          hasHtmlContent && this.saveFormat === 'docx'
            ? 'fileName'
            : 'originalFileName';
        fileNameField.value =
          this.rootStore.documentStore.documentName || 'document';
        form.appendChild(fileNameField);

        // PDF 문서 타입일 때는 페이지 번호 표시 여부도 전달
        if (isPdfDocument) {
          const showPageNumbersField = document.createElement('input');
          showPageNumbersField.type = 'hidden';
          showPageNumbersField.name = 'showPageNumbers';
          showPageNumbersField.value = showPageNumbers ? 'true' : 'false';
          form.appendChild(showPageNumbersField);
        }

        // form을 DOM에 추가하고 제출
        document.body.appendChild(form);
        form.submit();

        // 폼 제거 (약간 지연 후)
        setTimeout(() => {
          document.body.removeChild(form);
        }, 1000);

        await new Promise(resolve => setTimeout(resolve, 1000));

        uiStore.showSnackbar(
          `번역 결과가 ${this.outputFormat} 형식으로 저장되었습니다.`,
          'success'
        );
        return true;
      } catch (error) {
        console.error('서버 API 호출 중 오류:', error);
        uiStore.showSnackbar('파일 저장 중 오류가 발생했습니다.', 'error');
        return false;
      }
    } catch (err) {
      console.error('번역 파일 저장 중 오류:', err);
      this.rootStore.uiStore.showSnackbar(
        '파일 저장 중 오류가 발생했습니다.',
        'error'
      );
      return false;
    }
  };

  /**
   * 번역 진행 상태 저장 (로컬 스토리지 이용)
   * 현재 번역 상태를 로컬 스토리지에 저장하여 나중에 이어서 작업할 수 있도록 함
   * @returns 성공 여부
   */
  saveTranslationProgress = async () => {
    try {
      const { documentStore } = this.rootStore;
      const fileName = documentStore.documentName;

      if (!fileName) {
        return false;
      }

      const progressData = {
        translatedChunks: this.translatedChunks,
        currentIndex: this.currentTranslationIndex,
        translatedPages: this.translatedPages,
        fileName: fileName,
      };

      localStorage.setItem(
        `translation_progress_${fileName}`,
        JSON.stringify(progressData)
      );
      return true;
    } catch (err) {
      console.error('번역 진행 상태 저장 중 오류:', err);
      return false;
    }
  };

  /**
   * 번역 진행 상태 불러오기 (로컬 스토리지 이용)
   * 이전에 저장한 번역 상태를 로드하여 이어서 작업할 수 있도록 함
   * @param fileName 문서 파일명
   * @returns 성공 여부
   */
  loadTranslationProgress = async (fileName: string) => {
    try {
      if (!fileName) {
        return false;
      }

      const savedProgress = localStorage.getItem(
        `translation_progress_${fileName}`
      );

      if (!savedProgress) {
        return false;
      }

      const progressData = JSON.parse(savedProgress);

      this.translatedChunks = progressData.translatedChunks || [];
      this.currentTranslationIndex = progressData.currentIndex || 0;
      this.translatedPages = progressData.translatedPages || {};

      const { documentStore } = this.rootStore;
      if (documentStore.chunks.length > 0) {
        this.setTranslationProgress(
          (this.currentTranslationIndex / documentStore.chunks.length) * 100
        );
      }

      return true;
    } catch (err) {
      console.error('번역 진행 상태 불러오기 중 오류:', err);
      return false;
    }
  };

  /**
   * 번역 스토어 초기화
   * 모든 번역 관련 상태를 기본값으로 재설정
   */
  reset = () => {
    this.translatedChunks = [];
    this.currentTranslationIndex = 0;
    this.isTranslating = false;
    this.translationProgress = 0;
    this.translatedPages = {};
    // 기본 설정값은 유지
    // this.outputFormat = 'pdf';
    // this.saveFormat = 'pdf';
    // this.sourceLang = '영어';
  };

  /**
   * 번역 취소 및 상태 초기화
   */
  cancelTranslation = () => {
    // 진행 중인 API 요청 취소
    if (this.abortController) {
      console.log('[번역 취소] 진행 중인 API 요청 취소');
      this.abortController.abort();
      this.abortController = null;
    }

    // 번역 상태 초기화
    this.translatedChunks = [];
    this.isTranslating = false;
    this.translationProgress = 0;
    this.lastError = null;

    console.log('[번역 취소] 번역이 취소되고 상태가 초기화되었습니다.');
  };

  /**
   * 번역 시작 메서드
   * 번역 프로세스를 시작하고 첫 번째 청크 번역을 시도
   */
  startTranslation = async (): Promise<boolean> => {
    try {
      if (this.rootStore.documentStore.chunks.length === 0) {
        console.error('[번역 시작 실패] 번역할 텍스트가 없습니다.');
        return false;
      }

      this.isTranslating = true;
      this.currentTranslationIndex = 0;
      this.translationProgress = 0;

      console.log('[번역 시작] 번역을 시작합니다.');

      // 첫 번째 청크 번역 시작
      const success = await this.translateNextChunk();

      return success;
    } catch (error) {
      console.error('[번역 시작 오류]', error);
      this.lastError = new Date();
      this.isTranslating = false;
      return false;
    }
  };

  /**
   * 번역된 청크를 원본 HTML 구조에 다시 삽입
   * @param originalHtml 원본 HTML
   * @returns 번역된 HTML
   */
  reconstructHtml = async (originalHtml: string): Promise<string> => {
    if (!originalHtml) {
      console.warn('재구성할 원본 HTML이 없습니다.');
      return '';
    }

    // 번역된 청크가 없으면 빈 문자열 반환
    if (this.translatedChunks.length === 0) {
      console.warn('번역된 청크가 없습니다.');
      return originalHtml;
    }

    // 서버 API 호출로 HTML 재구성 (JSDOM은 서버에서 실행)
    try {
      console.log('번역된 HTML 재구성 시작');

      // 구조 정보가 있는 청크만 필터링 (테이블인 경우)
      const structuredChunks = this.translatedChunks.filter(
        chunk => chunk.structureType === 'table' && chunk.html
      );

      console.log(`구조 정보가 있는 번역된 청크: ${structuredChunks.length}개`);

      if (structuredChunks.length === 0) {
        console.warn('구조 정보가 있는 번역된 청크가 없습니다.');
        return originalHtml;
      }

      // 재구성 API 호출
      const response = await fetch('/api/translate/document/reconstruct-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: originalHtml,
          chunks: structuredChunks,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `HTML 재구성 요청 실패: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'HTML 재구성에 실패했습니다.');
      }

      console.log(`HTML 재구성 완료: ${data.updatedCount}개 요소 업데이트됨`);
      return data.html;
    } catch (error) {
      console.error('HTML 재구성 중 오류:', error);
      return originalHtml;
    }
  };

  /**
   * 번역된 HTML을 DOCX로 변환
   * API 서버에 요청하여 HTML 콘텐츠를 DOCX 파일로 변환
   * @param html 번역된 HTML
   * @param showPageNumbers 페이지 번호 표시 여부 (PDF 파일의 경우)
   * @param fileName 파일 이름
   * @returns DOCX 다운로드 URL
   */
  convertHtmlToDocx = async (
    html: string,
    showPageNumbers: boolean = false,
    fileName: string = 'translated_document.docx'
  ): Promise<string> => {
    if (!html) {
      console.warn('변환할 HTML이 없습니다.');
      return '';
    }

    try {
      console.log('HTML을 DOCX로 변환 시작');
      console.log(`페이지 번호 표시 여부: ${showPageNumbers}`);

      // API 호출하여 HTML을 DOCX로 변환
      const response = await fetch('/api/translate/document/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html,
          fileName,
          showPageNumbers: showPageNumbers ? 'true' : 'false',
        }),
      });

      if (!response.ok) {
        throw new Error(
          `DOCX 변환 요청 실패: ${response.status} ${response.statusText}`
        );
      }

      // 응답이 있으면 다운로드 URL 또는 파일 경로 반환
      return `/api/translate/download?file=${fileName}&timestamp=${Date.now()}`;
    } catch (error) {
      console.error('DOCX 변환 중 오류:', error);
      this.rootStore.uiStore.showSnackbar(
        'DOCX 변환 중 오류가 발생했습니다.',
        'error'
      );
      return '';
    }
  };

  makeKeyFromChunk = (chunk: DocumentChunk): string => {
    if (!chunk) return '';
    return `${chunk.id || ''}:${chunk.text}:${chunk.pages.join(',')}`;
  };

  /**
   * 텍스트 번역 및 번역된 청크 추가 (순차적으로 처리)
   * @param chunk 번역할 텍스트 청크
   * @returns 성공 여부
   */
  translateAndAddChunk = async (chunk: DocumentChunk): Promise<boolean> => {
    try {
      if (!chunk || !chunk.text) {
        console.warn('번역할 텍스트가 없습니다.');
        return false;
      }

      console.log(
        `번역 시작 [${this.progressCounter}/${this.totalChunks}]:`,
        chunk.id,
        chunk.text.substring(0, 30) + '...'
      );

      // 번역 시작
      const translatedChunk = await this.translateChunk(chunk);
      this.progressCounter++;
      this.translationProgress =
        (this.progressCounter / this.totalChunks) * 100;

      if (translatedChunk) {
        // 번역 성공 시 저장
        this.addTranslatedChunk(translatedChunk);
        return true;
      }
      return false;
    } catch (error) {
      console.error('텍스트 번역 오류:', error);
      return false;
    }
  };
}
