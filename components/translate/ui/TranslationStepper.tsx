import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
} from '@mui/material';
import { useStores } from '@/hooks/useStores';
import DocumentUploader from '../document/DocumentUploader';
import TranslationProcess from '../translation/TranslationProcess';
import TranslationResult from '../translation/TranslationResult';

// 번역 설정 단계 제거 (Gemini AI는 자동 언어 감지 기능이 있으므로)
const steps = ['파일 업로드', '번역 진행', '결과 확인'];

const TranslationStepper: React.FC = observer(() => {
  const { uiStore } = useStores();

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <DocumentUploader />;
      case 1:
        return <TranslationProcess />;
      case 2:
        return <TranslationResult />;
      default:
        return <Typography>알 수 없는 단계입니다.</Typography>;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={uiStore.activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={uiStore.activeStep > index}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Box sx={{ mt: 3 }}>{renderStepContent(uiStore.activeStep)}</Box>
    </Box>
  );
});

export default TranslationStepper;
