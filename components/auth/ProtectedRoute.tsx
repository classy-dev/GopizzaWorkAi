import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';

  useEffect(() => {
    if (!isLoading && !session) {
      // 세션이 없으면 로그인 페이지로 리다이렉트
      router.push('/');
    }
  }, [isLoading, router, session]);

  // 로딩 중이거나 세션이 없으면 null 반환 (아무것도 렌더링하지 않음)
  if (isLoading || !session) {
    return null;
  }

  // 세션이 있으면 자식 컴포넌트 렌더링
  return <>{children}</>;
};

export default ProtectedRoute;
