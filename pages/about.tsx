import React from 'react';
import Head from 'next/head';
import {
  Info as InfoIcon,
  Build as BuildIcon,
  Language as LanguageIcon,
  Translate as TranslateIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Link,
} from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { StoreProvider } from '@/hooks/useStores';

const About = () => {
  return (
    <>
      <Head>
        <title>정보 - PDF 글로벌 번역기</title>
        <meta name="description" content="PDF 글로벌 번역기 정보" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <StoreProvider>
        <MainLayout title="정보">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              PDF 글로벌 번역기
            </Typography>

            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                애플리케이션 정보
              </Typography>

              <Typography variant="body1" paragraph>
                PDF 글로벌 번역기는 다양한 언어로 작성된 PDF 문서를 한국어로
                번역하는 웹 애플리케이션입니다. Google의 Gemini API를 활용하여
                고품질 번역을 제공합니다.
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <InfoIcon />
                  </ListItemIcon>
                  <ListItemText primary="버전" secondary="1.0.0" />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <BuildIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="개발"
                    secondary="Next.js, Next-Auth, TypeScript, MobX, Material-UI, PostgreSQL, Prisma, Google Gemini API"
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="지원 언어"
                    secondary="영어, 인도(힌디어), 인도네시아어, 태국어, 베트남어, 일본어, 중국어(간체), 중국어(번체) 등"
                  />
                </ListItem>
              </List>
            </Paper>

            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                주요 기능
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <StorageIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="PDF 텍스트 추출"
                    secondary="PDF 파일에서 텍스트를 추출하여 번역 준비"
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <TranslateIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Gemini API를 통한 번역"
                    secondary="Google의 최신 AI 모델을 활용한 고품질 번역"
                  />
                </ListItem>

                
              </List>
            </Paper>

            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                사용 API
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" paragraph>
                이 애플리케이션은 Google의 Gemini API를 사용합니다. API 키는
                개인적으로 발급받아야 합니다.
              </Typography>

              <Link
                href="https://ai.google.dev/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: 'block', mb: 2 }}
              >
                Google AI Developer 사이트 방문
              </Link>

              <Typography variant="body2" color="text.secondary">
                © 2024 PDF 글로벌 번역기
              </Typography>
            </Paper>
          </Box>
        </MainLayout>
      </StoreProvider>
    </>
  );
};

export default About;
