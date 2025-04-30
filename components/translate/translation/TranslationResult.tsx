import React from 'react';
import { observer } from 'mobx-react-lite';
import { toast } from 'react-toastify';
import {
  RestartAlt as RestartIcon,
  Description as DocxIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useStores } from '@/hooks/useStores';

const TranslationResult: React.FC = observer(() => {
  const { translationStore, documentStore, uiStore } = useStores();

  const handleDownload = async (format: 'pdf' | 'docx') => {
    try {
      // 파일 다운로드를 직접 호출
      const result = await translationStore.saveTranslatedFile();
      if (result) {
        toast.success(`${format.toUpperCase()} 파일이 다운로드되었습니다.`);
      } else {
        toast.error('파일 다운로드 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 중 오류:', error);
      toast.error('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleRestart = () => {
    // 상태 초기화 - 새 번역 시작
    documentStore.clearDocumentFile(); // 문서 파일 초기화
    translationStore.setTranslatedChunks([]); // 번역된 청크 초기화
    translationStore.setCurrentTranslationIndex(0); // 현재 번역 인덱스 초기화
    uiStore.setActiveStep(0); // 첫 단계로 이동
  };

  // 번역 통계
  const totalChunks = documentStore.chunks.length;
  const translatedChunks = translationStore.translatedChunks.length; // .size가 아닌 .length 사용
  const totalPages = Object.keys(translationStore.translatedPages).length; // 번역된 페이지 수

  // 번역된 텍스트 길이 계산
  const totalCharCount = translationStore.translatedChunks.reduce(
    (sum, chunk) => sum + (chunk.translatedText?.length || 0),
    0
  );

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <CheckIcon color="success" sx={{ fontSize: 36, mr: 2 }} />
        <Typography variant="h5" component="h2">
          번역 완료
        </Typography>
      </Box>

      <Typography variant="body1" paragraph>
        문서 번역이 완료되었습니다. 아래에서 번역 결과를 다운로드하실 수
        있습니다.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                번역 통계
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="원본 파일"
                    secondary={documentStore.documentName} // fileName이 아닌 documentName 사용
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="원본 언어"
                    secondary={translationStore.sourceLang}
                  />
                </ListItem>               
                <ListItem>
                  <ListItemText
                    primary="번역된 글자 수"
                    secondary={
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 'bold', color: 'primary.main' }}
                      >
                        {totalCharCount.toLocaleString()}자
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                번역 결과 다운로드
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                원하는 형식을 선택하여 번역 결과를 다운로드하세요.
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<PDFIcon />}
                    onClick={() => {
                      translationStore.setOutputFormat('pdf');
                      handleDownload('pdf');
                    }}
                    sx={{ py: 1.5 }}
                  >
                    PDF 다운로드
                  </Button>
                </Grid> */}

                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<DocxIcon />}
                    onClick={() => {
                      translationStore.setOutputFormat('docx');
                      handleDownload('docx');
                    }}
                    sx={{ py: 1.5 }}
                  >
                    DOCX 다운로드
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RestartIcon />}
          onClick={handleRestart}
          size="large"
        >
          새 번역 시작하기
        </Button>
      </Box>
    </Paper>
  );
});

export default TranslationResult;
