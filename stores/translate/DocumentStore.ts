import { makeAutoObservable } from 'mobx';
import RootStore from './RootStore';
import { v4 as uuidv4 } from 'uuid';

/**
 * 문서 텍스트 청크 인터페이스
 * 텍스트와 해당 텍스트가 속한 페이지 번호를 포함
 */
export interface DocumentChunk {
  id: string;
  text: string;
  pages: number[];
  html?: string; // HTML 콘텐츠 (테이블인 경우 전체 테이블 HTML)
  structureType: 'text' | 'table' | 'image'; // 구조 타입 (텍스트, 테이블 또는 이미지)
  startPosition?: number; // 원본 HTML에서의 시작 위치
  endPosition?: number; // 원본 HTML에서의 끝 위치
}

/**
 * 문서 페이지 인터페이스
 * 페이지 번호와 해당 페이지의 텍스트를 포함
 */
export interface DocumentPage {
  page: number;
  pageNum?: number; // 서버 API에서 반환하는 페이지 번호 속성
  text: string;
  html?: string; // HTML 콘텐츠
}

/**
 * 지원하는 문서 파일 타입
 */
export type DocumentType = 'pdf' | 'docx' | 'txt' | 'unknown';

/**
 * 문서 관련 상태와 로직을 관리하는 스토어
 * 다양한 문서 파일 업로드, 텍스트 추출, 청크 분할 등의 기능 제공
 */
export class DocumentStore {
  rootStore: RootStore;

  // 문서 관련 상태
  documentFile: File | null = null;
  documentName: string = '';
  documentSize: number = 0;
  documentType: DocumentType = 'unknown';
  isLoading: boolean = false;
  isAnalyzingHtml: boolean = false; // HTML 분석 상태 추적
  progress: number = 0;
  extractedText: DocumentPage[] = [];
  chunks: DocumentChunk[] = []; // chunks로 변경
  error: string | null = null;
  chunkSize: number = 5000; // 청크 크기 기본값 (글자 수)
  blobUrl: string | null = null; // Blob Storage URL
  totalPages: number = 0; // 추가
  showPageNumbers: boolean = true; // 페이지 번호 표시 여부

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });
  }

  /**
   * 파일 확장자로부터 문서 타입 판별
   */
  getDocumentTypeFromFilename(filename: string): DocumentType {
    const ext = filename.toLowerCase().split('.').pop() || '';

    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx') return 'docx';
    if (ext === 'txt') return 'txt';

    return 'unknown';
  }

  /**
   * 문서 파일 설정
   * 파일이 설정되면 관련 상태 초기화
   * @param file 문서 파일
   */
  setDocumentFile = (file: File) => {
    if (!file) {
      console.warn('유효하지 않은 문서 파일');
      return;
    }

    this.documentFile = file;
    this.documentName = file.name;
    this.documentSize = file.size;
    this.documentType = this.getDocumentTypeFromFilename(file.name);
    this.extractedText = [];
    this.chunks = []; // chunks로 변경
    this.error = null;

    console.log(
      '문서 파일 설정됨:',
      file.name,
      `(${Math.round(file.size / 1024)}KB)`,
      `타입: ${this.documentType}`
    );
  };

  /**
   * Blob Storage URL 설정
   * @param url Blob Storage URL
   */
  setBlobUrl = (url: string) => {
    this.blobUrl = url;
    console.log('Blob URL 설정됨:', url);
  };

  /**
   * 추출된 텍스트 설정 및 청크 생성
   * @param pages 추출된 페이지 텍스트 배열
   * @param hasHtmlContent HTML 콘텐츠 포함 여부
   */
  setExtractedText = async (
    pages: DocumentPage[],
    hasHtmlContent: boolean = false
  ): Promise<void> => {
    if (!pages || pages.length === 0) {
      console.warn('설정할 텍스트가 없습니다.');
      return;
    }

    this.extractedText = pages;
    this.totalPages = pages.length;

    // 텍스트 청크 생성
    await this.createTextChunks();

    // DOCX 파일이고 HTML 콘텐츠가 있는 경우 HTML 분석
    if (this.documentType === 'docx' && hasHtmlContent) {
      const htmlContent = pages.find(page => !!page.html)?.html;
      if (htmlContent) {
        await this.analyzeHtmlContent(htmlContent);
      }
    }

    // 번역 스토어에 총 청크 수 전달
    if (this.rootStore.translationStore) {
      this.rootStore.translationStore.totalChunks = this.chunks.length;
    }
  };

  /**
   * 문서 파일 및 관련 상태 초기화
   */
  clearDocumentFile = () => {
    this.documentFile = null;
    this.documentName = '';
    this.documentSize = 0;
    this.documentType = 'unknown';
    this.extractedText = [];
    this.chunks = []; // chunks로 변경
    this.error = null;
    this.progress = 0;

    console.log('문서 상태 초기화됨');
  };

  /**
   * 로딩 상태 설정
   * @param loading 로딩 상태
   */
  setLoading = (loading: boolean) => {
    this.isLoading = loading;
  };

  /**
   * 진행률 설정
   * @param progress 진행률 (0-100)
   */
  setProgress = (progress: number) => {
    this.progress = progress;
  };

  /**
   * 텍스트 청크 설정
   * @param chunks 청크 배열
   */
  setTextChunks = (chunks: DocumentChunk[]) => {
    this.chunks = chunks; // chunks로 변경
    console.log('텍스트 청크 설정됨:', chunks.length, '개');
  };

  /**
   * 오류 설정
   * @param error 오류 메시지
   */
  setError = (error: string | null) => {
    this.error = error;
    if (error) {
      console.error('문서 처리 오류:', error);
    }
  };

  /**
   * 청크 크기 설정
   * @param size 청크 크기
   */
  setChunkSize = (size: number) => {
    if (size < 100) {
      console.warn('청크 크기가 너무 작습니다. 최소 100으로 설정합니다.');
      this.chunkSize = 100;
    } else if (size > 5000) {
      console.warn('청크 크기가 너무 큽니다. 최대 5000으로 설정합니다.');
      this.chunkSize = 5000;
    } else {
      this.chunkSize = size;
    }

    console.log('청크 크기 설정됨:', this.chunkSize);

    // 청크 크기가 변경되면 자동으로 청크 재분할
    if (this.extractedText.length > 0) {
      this.createTextChunks();
    }
  };

  /**
   * 페이지 번호 표시 여부 설정
   * @param show 표시 여부
   */
  setShowPageNumbers = (show: boolean) => {
    this.showPageNumbers = show;
    console.log('페이지 번호 표시 여부 설정됨:', show);
  };

  /**
   * 페이지 번호 표시 여부 반환
   * @returns 페이지 번호 표시 여부
   */
  getShowPageNumbers = (): boolean => {
    return this.showPageNumbers;
  };

  /**
   * 문서 파일에서 텍스트 추출
   * @returns 추출 성공 여부
   */
  extractTextFromDocument = async (): Promise<boolean> => {
    if (!this.documentFile) {
      this.setError('문서 파일이 선택되지 않았습니다.');
      return false;
    }

    this.setLoading(true);
    this.setProgress(0);
    this.setError(null);

    try {
      console.log('문서 텍스트 추출 시작:', this.documentName);

      // 서버에 파일 업로드 및 텍스트 추출 요청
      const formData = new FormData();
      formData.append('file', this.documentFile);

      // API 호출하여 문서 텍스트 추출
      const response = await fetch('/api/translate/document/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `문서 추출 요청 실패: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '문서 텍스트 추출에 실패했습니다.');
      }

      this.setProgress(100);

      // 서버 응답 처리
      const extractedPages: DocumentPage[] = data.textWithPages.map(
        (page: { text: string; pageNum: number; html?: string }) => ({
          page: page.pageNum,
          text: page.text,
          html: page.html,
        })
      );

      // 파일 타입 업데이트 (서버에서 더 정확하게 판별했을 수 있음)
      if (data.fileType) {
        this.documentType = data.fileType as DocumentType;
      }

      console.log(
        '서버에서 추출된 페이지 데이터:',
        extractedPages.length,
        '페이지'
      );
      await this.setExtractedText(extractedPages);

      // 자동으로 청크 분할 실행
      // this.processExtractedText(this.chunkSize);

      this.setLoading(false);

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '텍스트 추출 중 오류가 발생했습니다.';
      this.setError(errorMessage);
      this.rootStore.uiStore.showSnackbar(errorMessage, 'error');
      this.setLoading(false);
      return false;
    }
  };

  /**
   * 문서 텍스트를 청크로 분할
   * @param maxChars 최대 문자 수
   * @returns 청크 분할 성공 여부
   */
  processExtractedText = async (maxChars: number = 5000): Promise<boolean> => {
    console.log(
      `문서 텍스트 처리 시작: 총 ${this.extractedText.length}개 페이지`
    );

    if (!this.extractedText.length) {
      console.error('처리할 텍스트가 없습니다.');
      return false;
    }

    try {
      console.log(
        `[청크 분할 디버깅] 분할 시작: 전체 텍스트 길이 ${this.extractedText.reduce(
          (acc, page) => acc + page.text.length,
          0
        )}자, 최대 청크 길이 ${maxChars}자`
      );

      const chunks: DocumentChunk[] = [];

      // 각 페이지 텍스트 길이 로깅
      console.log(
        `[청크 분할 디버깅] 페이지별 텍스트 길이:`,
        this.extractedText.map(p => ({
          page: p.pageNum, // page 대신 pageNum 사용
          textLength: p.text.length,
        }))
      );

      // 1. 우선 전체 텍스트를 연결하여 문맥 유지 (페이지 경계 정보 유지)
      interface TextSegment {
        text: string;
        html?: string;
        page: number;
        isComplete: boolean; // 완전한 문장/문단인지 여부
      }

      // 각 페이지의 텍스트와 그 페이지 번호를 저장
      const segments: TextSegment[] = [];

      // 모든 페이지 텍스트 처리
      for (let i = 0; i < this.extractedText.length; i++) {
        const page = this.extractedText[i];
        // 페이지 번호 명시적 확인
        const pageNum = page.pageNum ?? i + 1; // pageNum이 없으면 인덱스+1 사용
        const text = page.text;
        const html = page.html;

        // 텍스트가 없는 페이지는 건너뛰기
        if (!text || text.trim().length === 0) {
          console.log(
            `[청크 분할 디버깅] 페이지 ${pageNum}에 텍스트가 없어 건너뜁니다.`
          );
          continue;
        }

        // 페이지 텍스트가 청크 크기를 초과하는지 확인 (마지막 문자열을 검사)
        const endsWithCompleteText = text.length < this.chunkSize;

        segments.push({
          text,
          page: pageNum, // 명시적 페이지 번호 저장
          html,
          isComplete: endsWithCompleteText,
        });

        if (!endsWithCompleteText && i < this.extractedText.length - 1) {
          console.log(
            `[청크 분할 디버깅] 페이지 ${pageNum} 텍스트가 완전하지 않음, 다음 페이지와 연결 필요`
          );
        }
      }

      // 2. 각 세그먼트 처리 (페이지 내부 및 페이지 경계 고려)
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const pageNum = segment.page;
        const segmentText = segment.text;
        const segmentHtml = segment.html;

        console.log(
          `[청크 분할 디버깅] 세그먼트 처리: 페이지 ${pageNum}, 완전성: ${segment.isComplete}, 길이: ${segmentText.length}자`
        );

        // 청크 분할 관련 상수 설정
        const maxChars = 5000; // 청크당 최대 글자 수를 5000 제한

        // 세그먼트가 최대 길이를 초과하면 분할
        if (segmentText.length > maxChars) {
          // 1. 문단 단위로 분리 (빈 줄로 구분)
          const paragraphs = segmentText.split(/\n\s*\n/);

          console.log(
            `[청크 분할 디버깅] 페이지 ${pageNum}: ${paragraphs.length}개 문단으로 분할`
          );

          let currentChunk = '';
          let currentHtml = '';
          let subPageIndex = 1; // 페이지 내 서브인덱스 (2-1, 2-2 등)
          // 연결된 세그먼트인 경우 이전/다음 페이지 번호도 추가
          const pageSet = new Set<number>([pageNum]);
          if (!segment.isComplete) {
            if (i > 0) pageSet.add(segments[i - 1].page);
            if (i < segments.length - 1) pageSet.add(segments[i + 1].page);
          }

          for (let j = 0; j < paragraphs.length; j++) {
            const paragraph = paragraphs[j].trim();

            if (!paragraph) {
              console.log(
                `[청크 분할 디버깅] 빈 문단 건너뛰기 (페이지 ${pageNum}, 문단 ${j})`
              );
              continue;
            }

            // 가독성을 위해 문단 사이에 빈 줄 추가 (불릿 포인트 제외)
            const formattedParagraph =
              paragraph.startsWith('•') ||
              paragraph.startsWith('-') ||
              paragraph.startsWith('*')
                ? paragraph
                : '\n' + paragraph + '\n';

            // 현재 문단 추가시 최대 길이를 초과하는 경우
            if (
              currentChunk.length + formattedParagraph.length > maxChars &&
              currentChunk
            ) {
              // 청크 생성 (페이지 번호에 서브인덱스 추가: 2-1, 2-2 등)
              const pageNumStr = pageNum !== undefined ? pageNum : 'nopage';
              const uniqueId = uuidv4().substring(0, 8); // UUID의 첫 8자리만 사용
              const chunkId = `chunk-${this.documentName
                .replace(/\s+/g, '_')
                .substring(0, 10)}_${pageNumStr}_${subPageIndex}_${uniqueId}`;

              const pagesArray = Array.from(pageSet).sort((a, b) => a - b);

              console.log(
                `[청크 분할 디버깅] 청크 생성: ID ${chunkId}, 페이지 ${pagesArray.join(
                  ','
                )}, 길이 ${currentChunk.length}자`
              );

              chunks.push({
                id: chunkId,
                text: currentChunk.trim(),
                html: currentHtml.trim(),
                pages: pagesArray,
                structureType: 'text', // 기본 타입은 텍스트
              });

              currentChunk = formattedParagraph;
              currentHtml = '';
              subPageIndex++;
            } else {
              // 현재 청크에 문단 추가
              currentChunk += (currentChunk ? '\n\n' : '') + formattedParagraph;
              if (segmentHtml) {
                currentHtml += (currentHtml ? '\n\n' : '') + segmentHtml;
              }
            }

            // 마지막 문단이거나 매우 긴 문단인 경우 처리
            if (j === paragraphs.length - 1 && currentChunk) {
              const pageNumStr = pageNum !== undefined ? pageNum : 'nopage';
              const uniqueId = uuidv4().substring(0, 8); // UUID의 첫 8자리만 사용
              const chunkId = `chunk-${this.documentName
                .replace(/\s+/g, '_')
                .substring(
                  0,
                  10
                )}_${pageNumStr}_${subPageIndex}_last_${uniqueId}`;

              const pagesArray = Array.from(pageSet).sort((a, b) => a - b);

              console.log(
                `[청크 분할 디버깅] 마지막 청크 생성: ID ${chunkId}, 페이지 ${pagesArray.join(
                  ','
                )}, 길이 ${currentChunk.length}자`
              );

              chunks.push({
                id: chunkId,
                text: currentChunk.trim(),
                html: currentHtml.trim(),
                pages: pagesArray,
                structureType: 'text', // 기본 타입은 텍스트
              });
            }
          }

          // 문단 분할이 효과적이지 않을 경우 (예: 매우 긴 단일 문단)
          // 강제로 문자 단위 분할
          if (chunks.filter(c => c.pages.includes(pageNum)).length === 0) {
            console.log(
              `[청크 분할 디버깅] 페이지 ${pageNum}: 문단 분할 실패, 강제 분할 적용`
            );

            // 강제 분할 (1000자 단위)
            for (let j = 0; j < segmentText.length; j += maxChars) {
              const chunkText = segmentText.substring(
                j,
                Math.min(j + maxChars, segmentText.length)
              );
              const subIndex = Math.floor(j / maxChars) + 1;
              const pagesArray = Array.from(pageSet).sort((a, b) => a - b);

              const pageNumStr = pageNum !== undefined ? pageNum : 'nopage';
              const uniqueId = uuidv4().substring(0, 8); // UUID의 첫 8자리만 사용
              const chunkId = `chunk-${this.documentName
                .replace(/\s+/g, '_')
                .substring(0, 10)}_${pageNumStr}_f${subIndex}_${uniqueId}`;

              console.log(
                `[청크 분할 디버깅] 강제 분할 청크: ID ${chunkId}, 페이지 ${pagesArray.join(
                  ','
                )}, 길이 ${chunkText.length}자`
              );

              chunks.push({
                id: chunkId,
                text: chunkText.trim(),
                html: segmentHtml
                  ? segmentHtml.substring(
                      j,
                      Math.min(j + maxChars, segmentHtml.length)
                    )
                  : undefined,
                pages: pagesArray,
                structureType: 'text', // 기본 타입은 텍스트
              });
            }
          }
        } else {
          // 세그먼트 텍스트가 최대 길이보다 짧은 경우 - 그냥 하나의 청크로 처리
          const chunkId = this.generateChunkId(pageNum);
          // 청크에 포함될 페이지 번호 배열 생성
          const pageArray = pageNum ? [pageNum] : [];

          console.log(
            `[청크 분할 디버깅] 단일 청크: ID ${chunkId}, 페이지 ${pageNum || '정보 없음'}, 길이 ${segmentText.length}자`
          );

          const chunk: DocumentChunk = {
            id: chunkId,
            text: segmentText,
            pages: pageArray, // 명시적으로 페이지 번호 배열 설정
            structureType: segmentHtml ? 'table' : 'text',
          };

          if (segmentHtml) {
            chunk.html = segmentHtml;
          }

          chunks.push(chunk);
        }
      }

      // 청크 설정
      this.setTextChunks(chunks);
      console.log(
        `청크 분할 완료: 총 ${chunks.length}개 청크 생성됨 (원본 ${this.extractedText.length}페이지)`
      );
      return true;
    } catch (error) {
      console.error('청크 분할 중 오류 발생:', error);
      this.setError(
        error instanceof Error
          ? error.message
          : '텍스트 청크 분할 중 오류가 발생했습니다'
      );
      return false;
    }
  };

  /**
   * 텍스트 청크 생성
   */
  createTextChunks = () => {
    if (this.extractedText.length === 0) {
      console.log('추출된 텍스트가 없어 청크를 생성할 수 없습니다.');
      return;
    }

    const segments: {
      text: string;
      page?: number;
      html?: string;
      isComplete: boolean;
    }[] = [];

    // 페이지별 텍스트 길이 계산 (디버깅 목적)
    console.log(
      '[청크 분할 디버깅] 페이지별 텍스트 길이:',
      this.extractedText.map(page => ({
        page: page.pageNum, // page 대신 pageNum 사용
        textLength: page.text.length,
      }))
    );

    // 1. 페이지 경계 고려하여 세그먼트 생성
    for (let i = 0; i < this.extractedText.length; i++) {
      const page = this.extractedText[i];
      // 페이지 번호 명시적 확인
      const pageNum = page.pageNum ?? i + 1; // pageNum이 없으면 인덱스+1 사용
      const text = page.text;
      const html = page.html;

      // 텍스트가 없는 페이지는 건너뛰기
      if (!text || text.trim().length === 0) {
        console.log(
          `[청크 분할 디버깅] 페이지 ${pageNum}에 텍스트가 없어 건너뜁니다.`
        );
        continue;
      }

      // 페이지 텍스트가 청크 크기를 초과하는지 확인 (마지막 문자열을 검사)
      const endsWithCompleteText = text.length < this.chunkSize;

      segments.push({
        text,
        page: pageNum, // 명시적 페이지 번호 저장
        html,
        isComplete: endsWithCompleteText,
      });

      if (!endsWithCompleteText && i < this.extractedText.length - 1) {
        console.log(
          `[청크 분할 디버깅] 페이지 ${pageNum} 텍스트가 완전하지 않음, 다음 페이지와 연결 필요`
        );
      }
    }

    // 2. 각 세그먼트를 청크로 분할
    const chunks: DocumentChunk[] = [];

    // 각 세그먼트 처리
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const pageNum = segment.page;
      const segmentText = segment.text;
      const segmentHtml = segment.html;

      console.log(
        `[청크 분할 디버깅] 세그먼트 처리: 페이지 ${pageNum}, 완전성: ${segment.isComplete}, 길이: ${segmentText.length}자`
      );

      // 세그먼트별로 적절한 크기의 청크 생성 (청크 크기 제한 준수)
      let remainingText = segmentText;
      let currentPosition = 0;

      // 단일 청크로 처리 가능한 작은 텍스트인 경우
      if (remainingText.length <= this.chunkSize) {
        const chunkId = this.generateChunkId(pageNum);

        // 청크에 포함될 페이지 번호 배열 생성
        const pageArray = pageNum ? [pageNum] : [];

        console.log(
          `[청크 분할 디버깅] 단일 청크: ID ${chunkId}, 페이지 ${pageNum || '정보 없음'}, 길이 ${remainingText.length}자`
        );

        const chunk: DocumentChunk = {
          id: chunkId,
          text: remainingText,
          pages: pageArray, // 명시적 페이지 번호 설정
          structureType: segmentHtml ? 'table' : 'text',
        };

        if (segmentHtml) {
          chunk.html = segmentHtml;
        }

        chunks.push(chunk);
      } else {
        // 큰 텍스트는 여러 청크로 분할 (청크 크기 제한 준수)
        console.log(
          `[청크 분할 디버깅] 페이지 ${pageNum}: ${Math.ceil(
            remainingText.length / this.chunkSize
          )}개 청크로 분할`
        );

        let chunkIndex = 0;
        while (remainingText.length > 0) {
          // 청크 크기 이내에서 가장 적절한 분할 지점 찾기
          let splitPos = Math.min(this.chunkSize, remainingText.length);

          // 다음 문단/문장 경계로 나누기
          if (splitPos < remainingText.length) {
            // 문단 경계로 나누기
            const paragraphPos = remainingText
              .slice(0, splitPos)
              .lastIndexOf('\n\n');
            if (paragraphPos > this.chunkSize * 0.5) {
              splitPos = paragraphPos + 2; // '\n\n' 포함
            } else {
              // 문장 경계로 나누기 (마침표 + 스페이스)
              const sentencePos = remainingText
                .slice(0, splitPos)
                .lastIndexOf('. ');
              if (sentencePos > this.chunkSize * 0.5) {
                splitPos = sentencePos + 2; // '. ' 포함
              } else {
                // 공백으로 나누기
                const spacePos = remainingText
                  .slice(0, splitPos)
                  .lastIndexOf(' ');
                if (spacePos > this.chunkSize * 0.5) {
                  splitPos = spacePos + 1; // ' ' 포함
                }
                // 적절한 분할 지점이 없으면 그냥 청크 크기로 자름
              }
            }
          }

          const chunkText = remainingText.slice(0, splitPos).trim();
          remainingText = remainingText.slice(splitPos).trim();

          // 청크 생성
          const isLastChunk = remainingText.length === 0;
          const chunkId = isLastChunk
            ? this.generateChunkId(pageNum, '_last')
            : this.generateChunkId(pageNum, chunkIndex.toString());

          // 페이지 번호 배열 생성 (페이지 번호가 있는 경우에만)
          const pageArray = pageNum ? [pageNum] : [];

          console.log(
            `[청크 분할 디버깅] ${
              isLastChunk ? '마지막' : chunkIndex + 1 + '번째'
            } 청크 생성: ID ${chunkId}, 페이지 ${pageNum || '정보 없음'}, 길이 ${
              chunkText.length
            }자`
          );

          const chunk: DocumentChunk = {
            id: chunkId,
            text: chunkText,
            pages: pageArray, // 명시적 페이지 번호 설정
            structureType: 'text',
          };

          chunks.push(chunk);
          chunkIndex++;

          // 5개 이상 청크가 생성된 경우 경고 로그 출력
          if (chunkIndex >= 5 && remainingText.length > 0) {
            console.warn(
              `[청크 분할 경고] 페이지 ${pageNum}에서 너무 많은 청크가 생성되고 있습니다. 청크 크기 조정을 고려하세요.`
            );
          }
        }
      }
    }

    // 최종 청크 설정
    this.chunks = chunks;
    console.log(`청크 생성 완료: 총 ${this.chunks.length}개 청크`);

    // 번역 스토어에 총 청크 수 전달
    if (this.rootStore.translationStore) {
      this.rootStore.translationStore.totalChunks = this.chunks.length;
    }
  };

  /**
   * HTML 콘텐츠 분석 및 처리
   * DOCX에서 추출한 HTML을 분석하여 표와 텍스트 구조 파악
   * @param html HTML 콘텐츠
   */
  analyzeHtmlContent = async (html: string): Promise<void> => {
    try {
      this.isAnalyzingHtml = true; // HTML 분석 시작

      console.log('HTML 콘텐츠 분석 시작');

      // HTML 분석 API 호출
      const response = await fetch('/api/translate/document/analyze-html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html }),
      });

      if (!response.ok) {
        throw new Error(
          `HTML 분석 실패: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'HTML 분석에 실패했습니다.');
      }

      const { chunks } = result;

      if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        console.warn('분석된 HTML 청크가 없습니다.');
        return;
      }

      console.log(`HTML 분석 완료: ${chunks.length}개의 청크 발견`);

      // 청크 통계 로깅
      const tableChunks = chunks.filter(c => c.structureType === 'table');
      const textChunks = chunks.filter(c => c.structureType === 'text');
      console.log(`- 테이블 청크: ${tableChunks.length}개`);
      console.log(`- 텍스트 청크: ${textChunks.length}개`);

      // 기존 청크 저장
      const existingChunks = [...this.chunks];

      // HTML에서 추출한 청크 추가
      chunks.forEach(chunk => {
        this.chunks.push({
          id: chunk.id,
          text: chunk.text,
          html: chunk.html,
          pages: chunk.pages || [1], // 기본 페이지 설정
          structureType: chunk.structureType,
          startPosition: chunk.startPosition,
          endPosition: chunk.endPosition,
        });
      });

      // 초기 전체 문서 청크 제거 (HTML 분석 후 세부 청크가 생성된 경우)
      if (chunks.length > 0 && existingChunks.length > 0) {
        // 초기 문서 청크는 ID가 "chunk-"로 시작하는 경우가 많음
        const initialChunks = existingChunks.filter(
          chunk => chunk.id && chunk.id.startsWith('chunk-')
        );

        if (initialChunks.length > 0) {
          console.log(
            `초기 전체 문서 청크 ${initialChunks.length}개 제거 시도...`
          );

          // 제거할 청크 ID 목록
          const chunksToRemove = initialChunks.map(chunk => chunk.id);
          console.log('제거할 청크 ID:', chunksToRemove);

          // 초기 청크 제거
          this.chunks = this.chunks.filter(
            chunk => !chunksToRemove.includes(chunk.id)
          );

          console.log(`청크 제거 완료. 남은 청크: ${this.chunks.length}개`);
        }
      }

      console.log(
        `청크 업데이트 완료: ${existingChunks.length} → ${this.chunks.length}`
      );

      // 번역 스토어에 청크 수 정보 전달 (필요 시)
      if (this.rootStore.translationStore) {
        this.rootStore.translationStore.totalChunks = this.chunks.length;
      }

      // UI 알림
      this.rootStore.uiStore.showSnackbar(
        `HTML 구조 분석 완료: ${chunks.length}개의 청크 발견`,
        'success'
      );
    } catch (error) {
      console.error('HTML 콘텐츠 분석 오류:', error);
      this.rootStore.uiStore.showSnackbar(
        '표 구조 분석 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      this.isAnalyzingHtml = false; // HTML 분석 완료
    }
  };

  /**
   * 문서 요약 정보 반환
   */
  getDocumentSummary = (): {
    name: string;
    size: string;
    type: string;
    pages: number;
    chunks: number;
  } => {
    return {
      name: this.documentName,
      size: `${(this.documentSize / 1024).toFixed(2)} KB`,
      type: this.documentType.toUpperCase(),
      pages: this.extractedText.length,
      chunks: this.chunks.length,
    };
  };

  /**
   * 상태 초기화
   */
  reset = () => {
    this.clearDocumentFile();
    // 기본 설정 유지
    // this.chunkSize = 2000;
  };

  /**
   * 청크 ID 생성
   * @param pageNum 페이지 번호
   * @param suffix 추가할 접미사
   * @returns 생성된 청크 ID
   */
  private generateChunkId(
    pageNum: number | undefined,
    suffix?: string
  ): string {
    const pageNumStr = pageNum !== undefined ? pageNum : 'nopage';
    const suffixStr = suffix ? `_${suffix}` : '';
    const uniqueId = uuidv4().substring(0, 8); // UUID의 첫 8자리만 사용
    return `chunk-${this.documentName
      .replace(/\s+/g, '_')
      .substring(0, 10)}_${pageNumStr}${suffixStr}_${uniqueId}`;
  }
}
