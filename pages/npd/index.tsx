import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  useTheme,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PizzaIcon from '@mui/icons-material/LocalPizza';
import LinkIcon from '@mui/icons-material/Link';
import MainLayout from '../../components/layout/MainLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

const NPDSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string>('');
  const [sources, setSources] = useState<{ url: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const theme = useTheme();
  const resultRef = useRef<HTMLDivElement>(null);

  // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults('');
    setSources([]);

    try {
      const response = await fetch('/api/npd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '검색 중 오류가 발생했습니다.');
      }

      const data = await response.json();
      console.log('프론트에서 받은 데이터:', data);

      setResults(data.result);

      // 소스 URL 정보가 있으면 설정
      if (data.sources && Array.isArray(data.sources)) {
        console.log('참조 URL 정보:', data.sources);
        setSources(data.sources);
      } else {
        console.log(
          '참조 URL 정보가 없거나 배열 형식이 아닙니다:',
          data.sources
        );
      }

      // 결과가 나오면 결과 영역으로 자동 스크롤
      if (resultRef.current) {
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('검색 오류:', err);
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <MainLayout title="NPD - 피자 신상품 검색">
      <Container maxWidth="lg">
        <Box mb={5}>
          <Typography
            variant="h4"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
            NPD - 피자 신상품 검색
          </Typography>
          <Typography variant="h6" gutterBottom color="text.secondary">
            신상품 개발을 위한 AI 웹 검색 도구
          </Typography>
          <Box mt={2}>
            <Typography variant="body1" paragraph>
              이 도구는 Google의 Gemini AI와 웹 검색을 결합하여 피자 신상품
              개발에 필요한 정보를 제공합니다. <br />
              트렌드, 재료, 경쟁사 정보 등 필요한 정보를 검색하고 AI가 분석하여
              정리된 결과를 확인하세요. <br />
              검색 결과는 실시간 웹 정보를 기반으로 생성됩니다.
            </Typography>
          </Box>
        </Box>

        <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 2 }}>
          <Typography
            variant="h5"
            gutterBottom
            fontWeight="bold"
            color="primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <PizzaIcon sx={{ mr: 1 }} /> 검색하기
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            신상품 개발에 필요한 정보를 검색해보세요. 예: "최신 피자 트렌드",
            "인기있는 피자 토핑", "건강한 피자 재료" 등
          </Typography>

          <Box
            mt={3}
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="검색어를 입력하세요"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              multiline
              minRows={2}
              maxRows={4}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SearchIcon />
                )
              }
              onClick={handleSearch}
              disabled={isLoading}
              sx={{
                minWidth: '120px',
                height: { xs: '50px', sm: 'auto' },
                borderRadius: 2,
              }}
            >
              {isLoading ? '검색 중...' : '검색'}
            </Button>
          </Box>

          {error && (
            <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
        </Paper>

        {/* 검색 결과 영역 */}
        <div ref={resultRef}>
          {results && (
            <Paper elevation={3} sx={{ p: 4, mb: 5, borderRadius: 2 }}>
              <Typography
                variant="h5"
                gutterBottom
                fontWeight="bold"
                color="primary"
              >
                검색 결과
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box
                sx={{
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                  p: 3,
                  borderRadius: 1,
                  '& a': {
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                  '& p': {
                    margin: '0.5em 0',
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    margin: '1em 0 0.5em',
                    color: theme.palette.text.primary,
                    fontWeight: 'bold',
                  },
                  '& ul, & ol': {
                    paddingLeft: '1.5em',
                    margin: '0.5em 0',
                  },
                  '& li': {
                    margin: '0.25em 0',
                  },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    margin: '1em 0',
                  },
                  '& th, & td': {
                    border: `1px solid ${theme.palette.divider}`,
                    padding: '0.5em',
                    textAlign: 'left',
                  },
                  '& blockquote': {
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    margin: '1em 0',
                    padding: '0 1em',
                    color: theme.palette.text.secondary,
                  },
                  '& code': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                    padding: '0.2em 0.4em',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                  },
                  '& pre': {
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                    padding: '1em',
                    borderRadius: '3px',
                    overflow: 'auto',
                    margin: '1em 0',
                    '& code': {
                      backgroundColor: 'transparent',
                      padding: 0,
                    },
                  },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {results}
                </ReactMarkdown>
              </Box>

              {/* 참조 URL 섹션 */}
              {sources.length > 0 && (
                <Box mt={3}>
                  <Typography
                    variant="h6"
                    fontWeight="medium"
                    color="primary"
                    gutterBottom
                  >
                    참고 출처{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                    >
                      (클릭하여 원문 보기)
                    </Typography>
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(0, 0, 0, 0.01)',
                      borderRadius: 1,
                    }}
                  >
                    <Grid container spacing={1}>
                      {sources.map((source, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LinkIcon
                              fontSize="small"
                              color="primary"
                              sx={{ mr: 1 }}
                            />
                            <Link
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                color: theme.palette.primary.main,
                                '&:hover': { textDecoration: 'underline' },
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                display: 'block',
                              }}
                            >
                              {source.title || source.url}
                            </Link>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                </Box>
              )}
            </Paper>
          )}
        </div>

        {/* 사용 가이드 영역 */}
        <Box mb={5}>
          <Typography
            variant="h5"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
            활용 가이드
          </Typography>
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={4}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent>
                  <Typography variant="h6" mb={2} fontWeight="medium">
                    트렌드 분석
                  </Typography>
                  <Typography variant="body2">
                    "2025년 피자 트렌드", "미국 최신 피자 트렌드" 등을 검색하여
                    최신 피자 트렌드를 파악하고 신상품 방향성 설정에 활용할 수
                    있습니다.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent>
                  <Typography variant="h6" mb={2} fontWeight="medium">
                    경쟁사 분석
                  </Typography>
                  <Typography variant="body2">
                    "도미노 신메뉴", "피자헛 인기 토핑" 등을 검색하여 경쟁사의
                    최신 제품과 전략을 파악하고 벤치마킹할 수 있습니다.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent>
                  <Typography variant="h6" mb={2} fontWeight="medium">
                    재료 연구
                  </Typography>
                  <Typography variant="body2">
                    "인기있는 피자 토핑", "건강한 피자 재료", "비건 피자 재료"
                    등을 검색하여 새로운 토핑과 재료 아이디어를 얻을 수
                    있습니다.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default NPDSearchPage;
