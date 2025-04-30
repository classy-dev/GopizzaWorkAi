import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { observer } from 'mobx-react-lite';
import { useSession } from 'next-auth/react';
import { toast, ToastContainer } from 'react-toastify';
import {
  Visibility,
  VisibilityOff,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { StoreProvider, useStores } from '@/hooks/useStores';
import 'react-toastify/dist/ReactToastify.css';

const SettingsContent = observer(() => {
  const { uiStore } = useStores();
  const { data: session, status } = useSession();
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success('API 키가 클립보드에 복사되었습니다.');
    } else {
      toast.error('복사할 API 키가 없습니다.');
    }
  };

  // 사용자의 API 키 가져오기
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const fetchApiKey = async () => {
        try {
          setLoading(true);
          const response = await fetch('/api/user/get-api-key');
          
          if (response.ok) {
            const data = await response.json();
            setApiKey(data.apiKey || '');
          } else {
            console.error('API 키를 가져오는데 실패했습니다.');
            toast.error('API 키를 가져오는데 실패했습니다.');
          }
        } catch (error) {
          console.error('API 키 요청 중 오류 발생:', error);
          toast.error('API 키를 가져오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };

      fetchApiKey();
    }
  }, [status, session]);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        설정
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          API 키 정보
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          PDF 번역을 위해서는 API 키가 필요합니다. API 키는 관리자에 의해 설정되며, 
          여기서 확인할 수 있습니다. API 키가 없거나 문제가 있는 경우 관리자에게 문의하세요.
        </Alert>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <TextField
                label="API 키"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey || ''}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="API 키 보기/숨기기"
                        onClick={toggleShowApiKey}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      <IconButton
                        aria-label="API 키 복사"
                        onClick={copyApiKey}
                        edge="end"
                        disabled={!apiKey}
                      >
                        <CopyIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            {!apiKey && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                API 키가 설정되어 있지 않습니다. 관리자에게 API 키 발급을 요청하세요.
              </Alert>
            )}
          </>
        )}
      </Paper>

      {/* <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          애플리케이션 설정
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={uiStore.isDarkMode}
              onChange={() => uiStore.toggleDarkMode()}
            />
          }
          label="다크 모드"
        />
      </Paper> */}
    </Box>
  );
});

const Settings = () => {
  return (
    <ProtectedRoute>
      <Head>
        <title>설정 - PDF 글로벌 번역기</title>
        <meta name="description" content="PDF 글로벌 번역기 설정" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <StoreProvider>
        <MainLayout title="설정">
          <SettingsContent />
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </MainLayout>
      </StoreProvider>
    </ProtectedRoute>
  );
};

export default Settings;
