import { createTheme } from '@mui/material/styles';
import { PaletteOptions } from '@mui/material';

// 기본 색상 팔레트 - 디자인에 맞는 청록색 계열로 업데이트
const palette: PaletteOptions = {
  primary: {
    main: '#0a3b41', // 짙은 청록색
    light: '#2c6e75', // 약간 밝은 버전
    dark: '#052a2f', // 더 짙은 버전
  },
  secondary: {
    main: '#62e3d5', // 밝은 청록색 (강조색)
    light: '#8ff0e6', // 더 밝은 버전
    dark: '#3bac9e', // 더 짙은 버전
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
  },
};

// 라이트 테마
export const lightTheme = createTheme({
  palette: {
    ...palette,
    mode: 'light',
    background: {
      default: '#f4f7fa', // 약간 청색 빛이 도는 밝은 회색
      paper: '#ffffff',
    },
    text: {
      primary: '#0a3b41', // 짙은 청록색
      secondary: '#5f6b6d', // 중간 톤의 청록색
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
        containedPrimary: {
          backgroundColor: '#0a3b41',
          '&:hover': {
            backgroundColor: '#052a2f',
          },
        },
        containedSecondary: {
          backgroundColor: '#62e3d5',
          color: '#0a3b41',
          '&:hover': {
            backgroundColor: '#3bac9e',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

// 다크 테마
export const darkTheme = createTheme({
  palette: {
    ...palette,
    mode: 'dark',
    background: {
      default: '#0f2428', // 매우 짙은 청록색 배경
      paper: '#163136', // 짙은 청록색 페이퍼
    },
    text: {
      primary: '#e6f2f4', // 청록색 계열의 밝은 텍스트
      secondary: '#90a4a7', // 중간 톤의 청록색 텍스트
    },
  },
  typography: {
    ...lightTheme.typography,
  },
  components: {
    ...lightTheme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundImage: 'none',
        },
      },
    },
  },
});

// 기본 테마 (lightTheme)
export default lightTheme;
