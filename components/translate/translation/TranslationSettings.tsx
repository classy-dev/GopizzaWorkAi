import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  Divider,
} from '@mui/material';
import { useStores } from '@/hooks/useStores';

interface TranslationFormData {
  sourceLang: string;
  chunkSize: number;
  saveFormat: 'pdf' | 'docx' | 'txt';
  resumeTranslation: boolean;
}

const sourceLangOptions = [
  '영어',
  "인도(힌디어)",
  "인도네시아어",
  '태국어',
  '베트남어',
  '일본어',
  '중국어(간체)',
  '중국어(번체)',
];

const TranslationSettings: React.FC = observer(() => {
  const { translationStore, uiStore } = useStores();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TranslationFormData>({
    defaultValues: {
      sourceLang: '자동감지',
      chunkSize: 5000,
      saveFormat: 'pdf',
      resumeTranslation: true,
    },
  });

  const onSubmit = async (data: TranslationFormData) => {
    try {
      setLoading(true);

      // 설정 적용
      translationStore.setSourceLang(data.sourceLang);

      // 다음 단계로 이동
      uiStore.nextStep();
    } catch (error) {
      console.error('번역 설정 적용 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    uiStore.prevStep();
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        번역 설정
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Controller
              name="sourceLang"
              control={control}
              rules={{ required: '원본 언어를 선택해주세요' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.sourceLang}>
                  <InputLabel>원본 언어</InputLabel>
                  <Select {...field} label="원본 언어">
                    {sourceLangOptions.map(lang => (
                      <MenuItem key={lang} value={lang}>
                        {lang}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.sourceLang && (
                    <FormHelperText>{errors.sourceLang.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Controller
              name="saveFormat"
              control={control}
              rules={{ required: '저장 형식을 선택해주세요' }}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.saveFormat}>
                  <InputLabel>저장 형식</InputLabel>
                  <Select {...field} label="저장 형식">
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="docx">DOCX</MenuItem>
                    <MenuItem value="txt">TXT</MenuItem>
                  </Select>
                  {errors.saveFormat && (
                    <FormHelperText>{errors.saveFormat.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button variant="outlined" onClick={handleBack} disabled={loading}>
            이전
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? '처리 중...' : '다음'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
});

export default TranslationSettings;
