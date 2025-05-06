# GopizzaWorkAi - 고피자 AI 업무 지원 시스템


## 프로젝트 개요

GopizzaWorkAi는 고피자 사내 업무 효율화를 위해 개발된 AI 기반  LLM 기술을 활용하는 플랫폼입니다. 프로젝트의 초기 상태로, 현재는 첫번째 기능인 다국어 문서 번역 기능이 구현되어 있습니다. 이 프로젝트는 고피자의 글로벌 비즈니스 확장과 다국어 환경에서의 원활한 의사소통을 지원하기 위해 개발되었습니다.


## 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 15.2.3, React 19
- **언어**: TypeScript
- **UI 라이브러리**: Material UI 6.4.8, Emotion
- **상태 관리**: MobX
- **폼 관리**: React Hook Form
- **알림**: React Toastify

### 백엔드
- **서버**: Next.js API Routes
- **데이터베이스**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **인증**: NextAuth.js

### LLM
- **LLM 엔진**: Google Generative AI (Gemini)

### 문서 처리
- **PDF 처리**: pdf-parse, pdfjs-dist, @react-pdf/renderer
- **DOCX 처리**: mammoth, docx, html-docx-js
- **이미지 처리**: Sharp, Canvas

### 인프라
- **배포**: Vercel
- **스토리지**: Vercel Blob Storage
- **데이터베이스 호스팅**: Supabase Cloud


## 주요 기능

### 📝 AI 다국어 번역기

- **다양한 문서 형식 지원**: PDF, DOCX, TXT 등 다양한 문서 형식의 번역 지원
- **원본 레이아웃 보존**: 번역 시 원본 문서의 형식과 레이아웃 최대한 유지
- **대용량 문서 처리**: 대용량 문서도 효율적으로 처리 가능

### 🔐 사용자 관리 시스템

- **사용자 인증**: 안전한 로그인 및 인증 시스템
- **권한 관리**: 관리자 및 일반 사용자 권한 구분
- **사용량 모니터링**: 사용자별 번역 사용량 추적 및 관리

### 📊 관리자 대시보드

- **사용 통계**: 번역 기능 사용 현황 통계 제공
- **API 키 관리**: 외부 서비스 연동을 위한 API 키 관리
- **사용자 관리**: 시스템 사용자 계정 관리

## 프로젝트 구조

```
GopizzaWorkAi/
├── components/           # 재사용 가능한 UI 컴포넌트
├── docs/                 # 문서화
├── hooks/                # 커스텀 React 훅
├── lib/                  # 유틸리티 함수 및 공통 로직
├── pages/                # 페이지 컴포넌트 및 API 라우트
│   ├── admin/            # 관리자 페이지
│   ├── ai-translate/     # 번역 관련 페이지
│   ├── api/              # API 엔드포인트
│       ├── admin/        # 관리자 API
│       ├── auth/         # 인증 관련 API
│       ├── translate/    # 번역 관련 API
│       ├── usage/        # 사용량 추적 API
│       └── user/         # 사용자 관리 API
├── prisma/               # Prisma 스키마 및 마이그레이션
├── public/               # 정적 파일
├── stores/               # MobX 상태 저장소
├── styles/               # 글로벌 스타일
├── types/                # 타입 정의
└── utils/                # 유틸리티 함수
```

## 데이터베이스 구성

본 프로젝트는 Supabase를 데이터베이스 및 인증 솔루션으로 활용하고 있습니다. Supabase는 PostgreSQL 기반의 오픈소스 Firebase 대체제로, 다음과 같은 기능을 제공합니다:

- **PostgreSQL 데이터베이스**: 강력한 관계형 데이터베이스 기능 활용
- **실시간 구독**: 데이터 변경 사항 실시간 반영
- **인증 및 권한 관리**: 사용자 인증 및 세밀한 권한 설정
- **스토리지**: 대용량 파일 저장 기능 (번역 대상 문서 저장)
- **Edge Functions**: 서버리스 함수 실행 환경

Prisma ORM을 통해 Supabase 데이터베이스와 연동하여 타입 안전한 데이터 액세스를 구현했습니다.

## 설치 및 실행 방법

### 필요 조건

- Node.js 18.0 이상
- Yarn 패키지 매니저
- Supabase 계정 및 프로젝트

### 설치

```bash
# 저장소 복제
git clone https://github.com/gopizza/GopizzaWorkAi.git
cd GopizzaWorkAi

# 의존성 설치
yarn install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```
# 기본 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google AI API 키
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 마이그레이션 (필요한 경우)
npx prisma migrate dev
```

### 개발 서버 실행

```bash
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속하여 애플리케이션을 확인할 수 있습니다.

### 프로덕션 빌드

```bash
yarn build
yarn start
```
