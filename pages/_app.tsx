import '@/styles/globals.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { observer } from 'mobx-react-lite';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import ClientOnly from '@/components/ClientOnly';
import { StoreProvider, useUIStore } from '@/hooks/useStores';
import { lightTheme, darkTheme } from '@/styles/theme';
import type { NextComponentType } from 'next';

// 확장된 AppProps 타입 (Next.js 타입 확장)
type CustomAppProps = AppProps & {
  Component: NextComponentType & {
    requireAuth?: boolean;
  };
};

// MobX 스토어를 사용하는 앱 컴포넌트
const AppContent = observer(({ Component, pageProps, router }: CustomAppProps) => {
  const uiStore = useUIStore();

  // 마운트 상태 업데이트
  useEffect(() => {
    uiStore.setMounted(true);

    // 시스템 다크 모드 감지 (클라이언트 사이드에서만 실행)
    if (typeof window !== 'undefined' && uiStore.useSystemTheme) {
      const isDarkMode = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (uiStore.isDarkMode !== isDarkMode) {
        uiStore.setDarkMode(isDarkMode);
      }
    }
  }, [uiStore]);

  // 서버 사이드 렌더링 또는 클라이언트 초기 마운트 시 간단한 로딩 표시
  if (!uiStore.isMounted) {
    return (
      <div
        style={{
          visibility: 'hidden',
          height: '100vh',
          width: '100vw',
          position: 'absolute',
        }}
      />
    );
  }

  return (
    <ClientOnly>
      <ThemeProvider theme={uiStore.isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </ClientOnly>
  );
});

// 앱의 진입점: StoreProvider로 감싸서 MobX 스토어를 제공
function MyApp(props: CustomAppProps) {
  const { Component, pageProps } = props;
  const { session, ...restPageProps } = pageProps;

  return (
    <SessionProvider session={session}>
      <StoreProvider>
        <AppContent {...props} />
      </StoreProvider>
    </SessionProvider>
  );
}

export default MyApp;
