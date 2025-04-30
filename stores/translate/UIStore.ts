import { makeAutoObservable } from 'mobx';

import { getCookie, setCookie } from 'cookies-next';
import RootStore from './RootStore';

export class UIStore {
  rootStore: RootStore;

  // UI 상태
  activeStep: number = 0;
  isDrawerOpen: boolean = false;
  selectedLanguage: string = '태국어 → 한국어';
  previewMode: boolean = false;
  isDarkMode: boolean = false;
  isMounted: boolean = false;
  useSystemTheme: boolean = false; // 시스템 테마 사용 여부

  // 알림 상태
  snackbarOpen: boolean = false;
  snackbarMessage: string = '';
  snackbarSeverity: 'success' | 'info' | 'warning' | 'error' = 'info';

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this, { rootStore: false });

    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      this.loadDarkModeFromCookie();
    }
  }

  setMounted = (mounted: boolean) => {
    this.isMounted = mounted;
  };

  loadDarkModeFromCookie = () => {
    try {
      const savedDarkMode = getCookie('darkMode') === 'true';
      const useSystemTheme = getCookie('useSystemTheme') === 'true';
      this.isDarkMode = savedDarkMode;
      this.useSystemTheme = useSystemTheme;
      this.isMounted = true;
    } catch (err) {
      console.error('다크모드 쿠키 로드 중 오류:', err);
    }
  };

  setActiveStep = (step: number) => {
    this.activeStep = step;
  };

  /**
   * 첫 번째 단계로 이동 (번역 취소 시 사용)
   */
  resetStep = () => {
    this.activeStep = 0;
  };

  nextStep = () => {
    this.activeStep += 1;
  };

  prevStep = () => {
    this.activeStep = Math.max(0, this.activeStep - 1);
  };

  toggleDrawer = () => {
    this.isDrawerOpen = !this.isDrawerOpen;
  };

  setSelectedLanguage = (language: string) => {
    this.selectedLanguage = language;
  };

  togglePreviewMode = () => {
    this.previewMode = !this.previewMode;
  };

  toggleDarkMode = () => {
    this.isDarkMode = !this.isDarkMode;
    this.useSystemTheme = false; // 수동으로 변경 시 시스템 테마 사용 해제

    // 쿠키에 다크모드 설정 저장
    try {
      setCookie('darkMode', this.isDarkMode.toString());
      setCookie('useSystemTheme', 'false');
    } catch (err) {
      console.error('다크모드 쿠키 저장 중 오류:', err);
    }
  };

  // 다크모드 직접 설정
  setDarkMode = (isDark: boolean) => {
    this.isDarkMode = isDark;

    // 쿠키에 다크모드 설정 저장
    try {
      setCookie('darkMode', this.isDarkMode.toString());
    } catch (err) {
      console.error('다크모드 쿠키 저장 중 오류:', err);
    }
  };

  // 시스템 테마 사용 설정
  setUseSystemTheme = (use: boolean) => {
    this.useSystemTheme = use;

    // 쿠키에 설정 저장
    try {
      setCookie('useSystemTheme', use.toString());

      if (use && typeof window !== 'undefined') {
        // 시스템 테마에 맞게 다크모드 설정
        const systemDarkMode = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        this.setDarkMode(systemDarkMode);
      }
    } catch (err) {
      console.error('시스템 테마 설정 저장 중 오류:', err);
    }
  };

  // 알림 관련 메서드
  showSnackbar = (
    message: string,
    severity: 'success' | 'info' | 'warning' | 'error' = 'info'
  ) => {
    this.snackbarMessage = message;
    this.snackbarSeverity = severity;
    this.snackbarOpen = true;
  };

  hideSnackbar = () => {
    this.snackbarOpen = false;
  };
}
