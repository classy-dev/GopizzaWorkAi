import React, { createContext, useContext } from 'react';
import RootStore from '../stores/translate/RootStore';

// RootStore 인스턴스를 보유할 컨텍스트 생성
const StoreContext = createContext<RootStore | null>(null);

// 자식 컴포넌트들에게 스토어를 제공하는 Provider 컴포넌트
export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // RootStore 인스턴스 생성 (앱이 처음 로드될 때만 한 번 생성)
  const root = React.useMemo(() => new RootStore(), []);

  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
};

// 모든 스토어에 접근할 수 있는 훅
export const useStores = () => {
  const context = useContext(StoreContext);

  if (context === null) {
    throw new Error('useStores must be used within a StoreProvider');
  }

  return context;
};

// 특정 스토어에만 접근할 수 있는 훅들
export const useDocumentStore = () => {
  const { documentStore } = useStores();
  return documentStore;
};

export const useUIStore = () => {
  const { uiStore } = useStores();
  return uiStore;
};

export const useTranslationStore = () => {
  const { translationStore } = useStores();
  return translationStore;
};
