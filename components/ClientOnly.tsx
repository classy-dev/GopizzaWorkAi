import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly 컴포넌트
 *
 * 클라이언트 사이드에서만 렌더링되어야 하는 컴포넌트를 감싸기 위한 래퍼
 * 서버 렌더링 중에는 fallback을 표시하고, 클라이언트에서 마운트 후에만 children을 렌더링
 * 이는 Next.js 하이드레이션 오류를 방지하는 데 도움됨
 */
export default function ClientOnly({
  children,
  fallback = null,
}: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : <>{fallback}</>;
}
