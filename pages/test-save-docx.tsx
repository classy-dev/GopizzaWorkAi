import React, { useState } from 'react';
import { Button, Box, Typography, TextField, Alert, CircularProgress } from '@mui/material';


export default function TestSaveDocxPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState('My name is Eunsuk');

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch(`/api/translate/translation/test-save-docx?text=${encodeURIComponent(text)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '문서 생성 중 오류가 발생했습니다.');
      }

      setResult(data);
    } catch (error) {
      console.error('문서 생성 오류:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          번역 DOCX 저장 테스트
        </Typography>

        <Typography variant="body1" paragraph>
          PDF 번역 애플리케이션의 DOCX 생성 및 다운로드 기능 테스트를 위한 페이지입니다.
          실제 번역 결과와 유사한 형태의 DOCX 파일을 생성하고 다운로드합니다.
        </Typography>

        <Box sx={{ my: 3 }}>
          <TextField
            label="테스트 텍스트"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : '테스트 문서 생성'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ my: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              파일명: {result.fileName}
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              파일 크기: {result.fileSizeMB} MB
            </Typography>
            
            <Button
              variant="outlined"
              color="primary"
              component="a"
              href={result.downloadUrl}
              sx={{ mt: 2 }}
            >
              문서 다운로드
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}
