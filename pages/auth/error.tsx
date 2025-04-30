import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ErrorOutline } from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Divider,
} from '@mui/material';

const AuthError = () => {
  const router = useRouter();
  const { error } = router.query;

  // 오류 메시지 매핑
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'CredentialsSignin':
        return '로그인 정보가 일치하지 않습니다. 아이디와 비밀번호를 확인해 주세요.';
      case 'SessionRequired':
        return '이 페이지는 로그인이 필요합니다.';
      case 'AccessDenied':
        return '접근 권한이 없습니다.';
      case 'Verification':
        return '인증 링크가 만료되었거나 이미 사용되었습니다.';
      case 'Configuration':
        return '인증 서버 설정에 문제가 있습니다. 관리자에게 문의하세요.';
      case 'Default':
      default:
        return '인증 중 오류가 발생했습니다. 다시 시도하거나 관리자에게 문의하세요.';
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ErrorOutline sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography component="h1" variant="h5" mb={3}>
            인증 오류
          </Typography>

          <Alert severity="error" sx={{ width: '100%', mb: 4 }}>
            {error ? getErrorMessage(error as string) : '알 수 없는 오류가 발생했습니다.'}
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => router.push('/')}
              sx={{ mb: 2 }}
            >
              로그인 페이지로 돌아가기
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                계정이 없으신가요?{' '}
                <Link href="/auth/signup" passHref>
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary"
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    회원가입
                  </Typography>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AuthError;
