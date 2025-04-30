import React, { useState } from 'react';
import Head from 'next/head';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Slider,
  Stack,
} from '@mui/material';

interface TestResult {
  success: boolean;
  message: string;
  fileName?: string;
  fileId?: string;
  fileSizeMB?: string;
  downloadUrl?: string;
}

export default function TestDocxPage() {
  const [method, setMethod] = useState<string>('base64');
  const [pageCount, setPageCount] = useState<number>(100);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [downloadStarted, setDownloadStarted] = useState<boolean>(false);

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value);
  };

  const handlePageCountChange = (_event: Event, newValue: number | number[]) => {
    setPageCount(newValue as number);
  };

  // API를 호출하여 대용량 문서 생성
  const handleGenerateFile = async () => {
    setIsLoading(true);
    setResult(null);
    setDownloadStarted(false);
    
    try {
      const response = await fetch(`/api/translate/translation/test-docx?method=${method}&pages=${pageCount}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 생성된 파일 직접 다운로드
  const handleDownloadFile = () => {
    if (result?.downloadUrl) {
      setDownloadStarted(true);
      
      // iframe을 사용하여 다운로드
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = result.downloadUrl;
      
      // 5초 후 iframe 제거
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);
    }
  };

  return (
    <>
      <Head>
        <title>대용량 DOCX 생성 테스트</title>
      </Head>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            대용량 DOCX 생성 테스트
          </Typography>
          <Typography color="text.secondary" paragraph>
            docx 라이브러리를 사용하여 대용량(100페이지) DOCX 파일을 생성하고 테스트합니다.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              생성 옵션 설정
            </Typography>
            
            <Stack spacing={3} sx={{ mb: 3 }}>
              <Box>
                <Typography gutterBottom>페이지 수: {pageCount}</Typography>
                <Slider
                  value={pageCount}
                  onChange={handlePageCountChange}
                  min={10}
                  max={200}
                  step={10}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 10, label: '10' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                    { value: 150, label: '150' },
                    { value: 200, label: '200' },
                  ]}
                />
                <Typography variant="caption" color="text.secondary">
                  페이지 수가 많을수록 생성 시간이 길어집니다
                </Typography>
              </Box>
              
              <RadioGroup
                aria-label="method"
                name="method"
                value={method}
                onChange={handleMethodChange}
              >
                <FormControlLabel 
                  value="base64" 
                  control={<Radio />} 
                  label="Base64 방식 (GitHub 이슈에서 제안된 방법)" 
                />
                <FormControlLabel 
                  value="buffer" 
                  control={<Radio />} 
                  label="Buffer 방식 (기존 방식)" 
                />
              </RadioGroup>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleGenerateFile}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? '문서 생성 중...' : '대용량 DOCX 파일 생성'}
            </Button>
          </Box>

          {result && (
            <Box sx={{ mt: 3 }}>
              <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {result.message}
              </Alert>
              
              {result.success && result.downloadUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    파일명: {result.fileName}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    파일 크기: {result.fileSizeMB} MB
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      color="success" 
                      onClick={handleDownloadFile}
                      disabled={downloadStarted}
                    >
                      {downloadStarted ? '다운로드 시작됨' : '파일 다운로드'}
                    </Button>
                    
                    <Button 
                      variant="outlined"
                      component="a"
                      href={result.downloadUrl}
                      target="_blank"
                    >
                      새 창에서 다운로드
                    </Button>
                  </Box>
                  
                  {downloadStarted && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      파일 다운로드가 시작되었습니다. MS Word에서 제대로 열리는지 확인해주세요.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          <Typography variant="subtitle2" color="text.secondary">
            이 테스트는 대용량 DOCX 파일이 메모리 및 디스크 처리에 문제가 없는지,<br />
            그리고 생성된 파일이 MS Word와 호환되는지 확인하기 위한 것입니다.
          </Typography>
        </Paper>
      </Container>
    </>
  );
}
