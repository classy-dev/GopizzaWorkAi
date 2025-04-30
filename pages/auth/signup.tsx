import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
// Removed unused icons
import {
  Grid, // Added Grid
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Fade,
  Grow,
  CircularProgress,
} from '@mui/material';

const SignUp = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Adjusted breakpoint for better layout split
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    userId: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    '국내사업본부',
    '상품본부',
    '브랜드기획본부',
    '경영관리본부',
    '글로벌전략실',
    '푸드테크본부',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    // ... (validation logic remains the same)
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return false;
    }
    if (!formData.department) {
      setError('소속본부를 선택해주세요.');
      return false;
    }
    if (!formData.userId.trim()) {
      setError('아이디를 입력해주세요.');
      return false;
    }
    if (formData.userId.length < 4) {
      setError('아이디는 최소 4자 이상이어야 합니다.');
      return false;
    }
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return false;
    }
    setError(''); // Clear error on successful validation
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    // setError(''); // Already cleared in validateForm

    try {
      const { name, department, userId, password } = formData;

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, userId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입 중 오류가 발생했습니다.');
      }

      // 회원가입 성공 시 로그인 페이지로 이동 (index -> /)
      router.push('/?signup=success'); // Redirect to login page with success indicator
    } catch (err) {
      console.error('회원가입 중 오류:', err);
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Video and text overlay content
  const VideoSection = () => (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        textAlign: 'center',
        p: 4,
        overflow: 'hidden',
      }}
    >
      {/* Video background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)', // Dark overlay
          }
        }}
      >
        <video 
          autoPlay 
          loop 
          playsInline 
          muted
          poster="https://images.pexels.com/videos/3129595/free-video-3129595.jpg"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
        >
          <source src="https://videos.pexels.com/video-files/3129595/3129595-uhd_2560_1440_30fps.mp4" type="video/webm" />
        </video>
      </Box>

      {/* Text overlay */}
      <Box sx={{ zIndex: 1, maxWidth: '80%' }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Every tool you need,
        </Typography>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          to excel at what you do.
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.1rem', mt: 2, opacity: 0.9 }}>
          AI-powered solutions to streamline your work and maximize efficiency across global operations.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Left Side (Video/Info) - Hidden on mobile */}
      <Grid
        item
        xs={false} // Hidden on extra-small screens
        sm={4}    // Takes 4 columns on small screens
        md={6}    // Takes 6 columns on medium screens and up
        sx={{
          display: { xs: 'none', sm: 'block' }, // Hide on xs, show on sm and up
          position: 'relative',
        }}
      >
        <VideoSection />
      </Grid>

      {/* Right Side (Sign Up Form) */}
      <Grid
        item
        xs={12} // Takes full width on extra-small screens
        sm={8}  // Takes 8 columns on small screens
        md={6}  // Takes 6 columns on medium screens and up
        component={Paper}
        elevation={6}
        square // Use square edges for seamless integration
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center', // Center form vertically
          background: theme.palette.background.default, // Use theme background
        }}
      >
        <Fade in={true} timeout={1000}>
          <Box
            sx={{
              my: 8, // Margin top and bottom
              mx: 4, // Margin left and right
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%', // Ensure box takes available width
              maxWidth: 450, // Limit max width of the form itself
            }}
          >
            <Grow in={true} timeout={1500}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                 <img src="https://gopizza.kr/images/common2/logox2.webp" alt="Gopizza Logo" style={{ width: '100px', marginBottom: '16px' }} />
                 <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
                  AI 서비스 시작하기
                 </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                   업무 효율성을 위한 서비스
                 </Typography>
              </Box>
            </Grow>

            <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
              {error && (
                <Grow in={!!error}>
                  <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>
                </Grow>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="이름"
                name="name"
                autoComplete="name"
                autoFocus // Focus on first field
                value={formData.name}
                onChange={handleChange}
                variant="outlined" // Consistent variant
                 sx={{ mb: 2 }}
              />

              <FormControl fullWidth required margin="normal" variant="outlined" sx={{ mb: 2 }}>
                <InputLabel id="department-label">소속본부</InputLabel>
                <Select
                  labelId="department-label"
                  id="department"
                  name="department"
                  value={formData.department}
                  label="소속본부"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="" disabled>
                    <em>소속본부를 선택해주세요</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="userId"
                label="아이디 (4자 이상)"
                name="userId"
                autoComplete="username"
                value={formData.userId}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="비밀번호 (6자 이상)"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="passwordConfirm"
                label="비밀번호 확인"
                type="password"
                id="passwordConfirm"
                autoComplete="new-password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2 }} // Consistent margin
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2, // Adjusted margin
                  py: 1.5,
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                   // Use theme's primary color for consistency
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  '&:hover': {
                    opacity: 0.9,
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`, // Darken on hover
                  },
                }}
              >
                {isLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                    가입 처리 중...
                  </Box>
                ) : (
                  '가입 완료하기'
                )}
              </Button>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  이미 계정이 있으신가요?{' '}
                  <Link href="/" passHref>
                    <Typography
                      component="span"
                      variant="body2"
                      color="primary" // Use theme primary color
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      로그인하기
                    </Typography>
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Grid>
    </Grid>
  );
};

export default SignUp;