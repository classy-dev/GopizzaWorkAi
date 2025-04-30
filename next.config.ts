import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  
  // PDF.js 워커 파일 및 기타 파일을 복사하기 위한 설정
  webpack: (config, { isServer }) => {
    // PDF.js 워커 파일을 public 디렉토리로 복사
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // pdfjs-dist 모듈의 워커를 직접 참조할 수 있도록 별칭 설정
        'pdfjs-dist/build/pdf.worker.js': 'pdfjs-dist/legacy/build/pdf.worker.js',
      };
    }

    return config;
  },
  
  // API 타임아웃 증가
  serverRuntimeConfig: {
    // API 요청 처리 시간 증가 (밀리초 단위)
    apiTimeout: 300000, // 5분
  },
};

export default nextConfig;
