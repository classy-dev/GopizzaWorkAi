// Vercel 서버리스 환경에서 PDF.js 워커 설정을 위한 헬퍼 파일

/**
 * PDF.js 워커 파일 경로를 설정하는 함수
 * Vercel 서버리스 환경에서도 정상 작동하도록 경로 처리
 */
export function getPdfWorkerPath(): string {
  // 클라이언트 환경인 경우 public 폴더의 워커 파일 경로 반환
  if (typeof window !== 'undefined') {
    return '/pdf-worker/pdf.worker.js';
  }

  // 서버리스 환경에서는 빈 문자열 반환 (fakeWorker 모드 활성화)
  return '';
}
