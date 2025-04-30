import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signIn, useSession } from 'next-auth/react';
import { LockOutlined, BubbleChart, AutoAwesome } from '@mui/icons-material';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Divider,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
} from '@mui/material';

const SignIn = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 이미 로그인된 사용자는 번역 페이지로 리다이렉트
  useEffect(() => {
    if (session) {
      router.push('/ai-translate');
    }
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { userId, password } = formData;

      if (!userId || !password) {
        setError('아이디와 비밀번호를 모두 입력해주세요.');
        setIsLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        userId,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        setIsLoading(false);
        return;
      }

      // 로그인 성공 시 번역 페이지로 리디렉션
      router.push('/ai-translate');
    } catch (err) {
      console.error('로그인 중 오류:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 로딩 중이면 로딩 인디케이터 표시
  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a1128 0%, #1a237e 100%)',
        }}
      >
        <CircularProgress size={60} sx={{ color: '#ffffff' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a1128 0%, #1a237e 100%)',
        pt: 4,
        pb: 4,
      }}
    >
      {/* Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          zIndex: 0,
          opacity: 0.5,
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(10deg)' },
            '100%': { transform: 'translateY(0px) rotate(0deg)' },
          },
        }}
      >
        <BubbleChart
          sx={{
            fontSize: isMobile ? 80 : 120,
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        />
      </Box>
      
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          zIndex: 0,
          opacity: 0.5,
          animation: 'float2 10s ease-in-out infinite',
          '@keyframes float2': {
            '0%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-30px) rotate(-10deg)' },
            '100%': { transform: 'translateY(0px) rotate(0deg)' },
          },
        }}
      >
        <AutoAwesome
          sx={{
            fontSize: isMobile ? 70 : 100,
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        />
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={1000}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Grow in={true} timeout={1500}>
              <Paper
                elevation={8}
                sx={{
                  p: 4,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'primary.main',
                    borderRadius: '50%',
                    p: 2,
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  <LockOutlined sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography
                  component="h1"
                  variant="h4"
                  mb={1}
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(45deg, #1a237e, #4051b5)',
                    backgroundClip: 'text',
                    textFillColor: 'transparent',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Gopizza WorkUp AI
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" mb={3}>
                  이용을 위해 로그인해 주세요
                </Typography>

                {error && (
                  <Fade in={!!error} timeout={300}>
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                      {error}
                    </Alert>
                  </Fade>
                )}

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ width: '100%', mt: 1 }}
                >
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="userId"
                    label="아이디"
                    name="userId"
                    autoComplete="username"
                    autoFocus
                    value={formData.userId}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                      mb: 2,
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="비밀번호"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                      mb: 2,
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      mt: 2,
                      mb: 3,
                      py: 1.5,
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      textTransform: 'none',
                      background: 'linear-gradient(45deg, #1a237e, #4051b5)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {isLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                        로그인 중...
                      </Box>
                    ) : (
                      '로그인'
                    )}
                  </Button>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      계정이 없으신가요?{' '}
                      <Link href="/auth/signup" passHref>
                        <Typography
                          component="span"
                          variant="body2"
                          color="primary"
                          sx={{
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            '&:hover': {
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          회원가입
                        </Typography>
                      </Link>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grow>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default SignIn;
