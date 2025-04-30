import Head from 'next/head';
import { observer } from 'mobx-react-lite';
import { ToastContainer } from 'react-toastify';
import { 
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { Box, Typography, Grid } from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Card from '@/components/common/Card';
import MainLayout from '@/components/layout/MainLayout';
import TranslationStepper from '@/components/translate/ui/TranslationStepper';
import 'react-toastify/dist/ReactToastify.css';

const Home = observer(() => {


  return (
    <ProtectedRoute>
      <>
        <Head>
          <title>AI 다국어 번역기</title>
          <meta
            name="description"
            content="PDF, DOCX, TXT 등 다양한 문서 형식을 한국어로 번역하는 애플리케이션"
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <MainLayout title="AI 다국어 번역기">
          {/* 대시보드 헤더 섹션 */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                color: '#0a3b41',
                fontSize: { xs: '1.8rem', md: '2.2rem' } 
              }}
            >
              AI 다국어 번역기
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '800px' }}>
              원문에 담긴 다양한 언어를 자동으로 감지하여 PDF, DOCX, TXT 문서를 한국어로 번역하는 AI서비스
            </Typography>
          </Box>


          {/* 메인 번역 섹션 */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                title="새 문서 번역하기"
                subtitle="파일을 업로드하고 번역을 시작하세요"
                icon={<UploadIcon />}
                elevation={0}
                borderColor="rgba(0, 0, 0, 0.08)"
                headerBg="rgba(98, 227, 213, 0.05)"
              >
                <TranslationStepper />
              </Card>
            </Grid>
          </Grid>

          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </MainLayout>
      </>
    </ProtectedRoute>
  );
});

export default Home;
