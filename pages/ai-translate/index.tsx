import React from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import ExtensionIcon from '@mui/icons-material/Extension';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SecurityIcon from '@mui/icons-material/Security';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import TableChartIcon from '@mui/icons-material/TableChart';
import TranslateIcon from '@mui/icons-material/Translate';
import { Box, Typography, Container, Paper, Grid, Card, CardContent } from '@mui/material';
import MainLayout from '../../components/layout/MainLayout';

const IntroductionPage: React.FC = () => {
  return (
    <MainLayout title="AI 번역 서비스 소개">
      <Container maxWidth="lg">
        <Box mb={5}>
          <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
            AI 번역 서비스 소개
          </Typography>
          <Typography variant="h6" gutterBottom color="text.secondary">
            고피자 직원들을 위한 효율적인 문서 번역 솔루션
          </Typography>
          <Box mt={2}>
            <Typography variant="body1" paragraph>
              본 AI 번역 서비스는 고피자 내부 문서를 다양한 언어로 신속하고 정확하게 번역하기 위해 개발되었습니다. <br />
              PDF, DOCX, PPTX 등 다양한 형식의 파일을 지원하며, 원본 문서의 레이아웃과 서식을 최대한 유지하면서 번역 결과를 제공합니다.<br />
              구글의 최신 Gemini 의 AI 를 통한 번역을 사용하며, 지속적인 AI 발전에 의해 번역품질은 시간이 지날 수록 더욱 향상됩니다.
            </Typography>
          </Box>
        </Box>

        <Box mb={5}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            주요 기능
          </Typography>
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <TranslateIcon color="primary" fontSize="large" />
                    <Typography variant="h6" ml={1} fontWeight="medium">다국어 지원</Typography>
                  </Box>
                  <Typography variant="body2">
                    다양한 언어 간의 번역을 지원하여 글로벌 커뮤니케이션을 돕습니다. 고피자의 모든 지사에서 사용할 수 있습니다.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <InsertDriveFileIcon color="primary" fontSize="large" />
                    <Typography variant="h6" ml={1} fontWeight="medium">다양한 파일 형식</Typography>
                  </Box>
                  <Typography variant="body2">
                    PDF, DOCX, TXT 파일을 업로드하여 번역할 수 있으며, 각 파일 형식의 특성을 고려한 최적의 번역 결과를 제공합니다.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={2} sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <TableChartIcon color="primary" fontSize="large" />
                    <Typography variant="h6" ml={1} fontWeight="medium">레이아웃 or 페이지정보 제공</Typography>
                  </Box>
                  <Typography variant="body2">
                    DOCX의 경우, 문서의 표, 이미지, 서식 등 원본 레이아웃을 최대한 유지하면서 텍스트만 번역하여 문서의 가독성을 유지합니다. PDF에서는 정확한 페이지정보를 제공합니다.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Box mb={6}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            지원 파일별 특징 및 기능
          </Typography>
          
          {/* DOCX 파일 번역 섹션 */}
          <Paper elevation={1} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, mt: 3, mb: 4 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <DescriptionIcon color="primary" fontSize="large" />
              <Typography variant="h6" ml={1} fontWeight="bold">DOCX 파일 번역</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography variant="body1" paragraph>
                  워드 문서(DOCX)는 원본 문서의 요소를 보존하면서 번역이 가능합니다.
                </Typography>
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="medium" color="primary" gutterBottom>
                    주요 기능:
                  </Typography>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>표 구조 보존</strong> - 표 내의 텍스트만 번역되고 표 구조는 그대로 유지됩니다.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>이미지 보존</strong> - 문서 내 이미지가 원래 위치에 그대로 유지됩니다.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>서식 유지</strong> - 글꼴, 크기, 색상 등 모든 텍스트 서식이 보존됩니다.
                      </Typography>
                    </li>
                  </ul>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" mb={1} color="text.secondary" align="center">
                    DOCX 번역 예시
                  </Typography>
                  <Box component="img" src="/images/translate/docx-sample.png" alt="DOCX 번역 예시" sx={{ width: '100%', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* PDF 파일 번역 섹션 */}
          <Paper elevation={1} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2, mb: 4 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <PictureAsPdfIcon color="primary" fontSize="large" />
              <Typography variant="h6" ml={1} fontWeight="bold">PDF 파일 번역</Typography>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Typography variant="body1" paragraph>
                  PDF는 그래픽 기반 문서로, 문서 내 텍스트만 추출하여 번역합니다. 복잡한 레이아웃과 디자인을 가진 PDF도 텍스트 내용을 정확하게 번역해드립니다.
                </Typography>
                <Box mt={2}>
                  <Typography variant="subtitle1" fontWeight="medium" color="primary" gutterBottom>
                    최근 업데이트된 기능:
                  </Typography>
                  <ul style={{ paddingLeft: '20px' }}>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>정확한 페이지 추적</strong> - 이전에는 전체 텍스트를 추출하여 번역했으나, 이제는 페이지 정보를 정확하게 추출하여 원본 PDF와 쉽게 비교할 수 있습니다.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>텍스트 컨텍스트 유지</strong> - 텍스트 추출 시 문맥을 최대한 유지하여 번역 품질을 향상시켰습니다.
                      </Typography>
                    </li>
                  </ul>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" mb={1} color="text.secondary" align="center">
                    PDF 번역 예시
                  </Typography>
                  <Box component="img" src="/images/translate/pdf-sample.png" alt="PDF 번역 예시" sx={{ width: '100%', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* 파워포인트 번역 섹션 */}
          <Paper elevation={1} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <SlideshowIcon color="primary" fontSize="large" />
              <Typography variant="h6" ml={1} fontWeight="bold">파워포인트(PPTX) 번역 - 구글 슬라이드 전용</Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              <strong>클릭 몇 번만으로 파워포인트 전체를 번역하는 '파워포인트 번역기'</strong>를 고피자 직원들만을 위해 제작했습니다. 이 도구는 <strong>구글 슬라이드에서만 사용 가능한 프라이빗 애드온</strong>으로, 한국어에서 영어로만 아니라 베트남어, 히디어 등 다양한 언어 간 번역을 지원합니다.
            </Typography>
            
            <Box mt={3}>
              <Typography variant="subtitle1" fontWeight="medium" color="primary" gutterBottom>
                사용 방법 가이드:
              </Typography>
              
              <Box sx={{ pl: 2, borderLeft: '2px solid #62e3d5', mb: 4 }}>
                {/* 1단계 */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  1단계: 접근 권한 획득
                </Typography>
                <Typography variant="body2" mb={2}>
                  푸드테크 연구소에 요청하여 사용 권한 및 접속 링크를 받으세요. 승인된 사용자만 이 서비스를 이용할 수 있습니다.
                </Typography>
                <Box display="flex" justifyContent="left" mb={7}>
                  <Box component="img" src="/images/translate/slide-how1.jpg" alt="접근 권한 획득" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
                
                {/* 2단계 */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  2단계: 설치 시작
                </Typography>
                <Typography variant="body2" mb={2}>
                  접속 링크에서 '설치' 버튼을 클릭한 후, '계속' 버튼을 누르고 계정을 선택하세요.
                </Typography>
                <Box display="flex" justifyContent="left" gap={2} mb={7}>
                  <Box component="img" src="/images/translate/slide-how2-1.jpg" alt="설치 과정 1" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                  <Box component="img" src="/images/translate/slide-how2-2.jpg" alt="설치 과정 2" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
                
                {/* 3단계 */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  3단계: 안전 확인
                </Typography>
                <Typography variant="body2" mb={2}>
                  고피자 직원 전용 비공개 앱이기 때문에 '구글에서 확인하지 않은 앱' 경고가 표시됩니다. '고급' 버튼을 누른 후 'gopizza-translate-slide(으)로 이동(안전하지 않음)'을 클릭하세요.
                </Typography>
                <Box display="flex" justifyContent="left" gap={2} mb={7}>
                  <Box component="img" src="/images/translate/slide-how3-1.jpg" alt="안전 확인 1" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                  <Box component="img" src="/images/translate/slide-how3-2.jpg" alt="안전 확인 2" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
                
                {/* 4단계 */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  4단계: 앱 허용 및 설치 완료
                </Typography>
                <Typography variant="body2" mb={2}>
                  팝업 화면에서 '계속' 버튼을 클릭한 후, 다음 팝업에서 '허용'을 선택하여 설치를 완료하세요.
                </Typography>
                <Box display="flex" justifyContent="left" gap={2} mb={7}>
                  <Box component="img" src="/images/translate/slide-how4-1.jpg" alt="앱 허용 1" sx={{ width: { xs: '160px', md: '333px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                  <Box component="img" src="/images/translate/slide-how4-2.jpg" alt="앱 허용 2" sx={{ width: { xs: '160px', md: '334px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                  <Box component="img" src="/images/translate/slide-how4-3.jpg" alt="앱 허용 3" sx={{ width: { xs: '160px', md: '333px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
                
                {/* 5단계 */}
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  5단계: 번역 시작
                </Typography>
                <Typography variant="body2" mb={2}>
                  구글 슬라이드 사이드바에 새로운 번역 아이콘이 나타납니다. 클릭하여 원하는 번역 언어를 선택하고 '번역 시작'을 누르세요.
                  이제부터 문서의 구조가 유지되면서, 한국어 → 영어(베트남어, 히디어 등) 번역만 아니라, 베트남어 → 일본어 등 다양한 언어 간 번역을 편리하게 사용할 수 있습니다.
                </Typography>
                <Box display="flex" justifyContent="left" gap={2} mb={5}>
                  <Box component="img" src="/images/translate/slide-how5-1.jpg" alt="번역 시작 1" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                  <Box component="img" src="/images/translate/slide-how5-2.jpg" alt="번역 시작 2" sx={{ width: { xs: '250px', md: '500px' }, height: 'auto', borderRadius: 1, border: '1px solid #eee' }} />
                </Box>
              </Box>
            </Box>
            
            {/* 중요 안내 */}
            <Box mt={2} p={2} sx={{ bgcolor: '#fff8e1', borderRadius: 2, border: '1px solid #ffe57f' }}>
              <Typography variant="subtitle2" color="warning.dark" fontWeight="bold">
                중요 안내
              </Typography>
              <Typography variant="body2" mt={1}>
                • 구글 슬라이드에서만 사용 가능합니다. (Microsoft PowerPoint에서는 사용할 수 없음)
              </Typography>
              <Typography variant="body2">
                • 고피자 직원들만을 위한 전용 애드온으로, 마켓에 공개되지 않았습니다.
              </Typography>
              <Typography variant="body2">
                • 구글 번역 엔진을 사용하므로 중요한 문서는 번역 후 최종 검토가 필요합니다.
              </Typography>
            </Box>
            
            {/* 번역 결과 예시 */}
            <Box mt={10} sx={{ bgcolor: '#f9f9f9', p: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" mb={2} color="primary" fontWeight="bold" align="center">
                번역 결과 예시
              </Typography>
              <Box component="img" src="/images/translate/slide-sample1.png" alt="파워포인트 번역 예시" sx={{ width: '100%', maxWidth: { xs: '600px', md: '800px' }, margin: '0 auto', display: 'block', borderRadius: 1, border: '1px solid #eee', mb: 3 }} />
              <Box component="img" src="/images/translate/slide-sample.png" alt="파워포인트 번역 예시" sx={{ width: '100%', maxWidth: { xs: '600px', md: '800px' }, margin: '0 auto', display: 'block', borderRadius: 1, border: '1px solid #eee', mb: 3 }} />
              <Typography variant="caption" color="text.secondary" align="center" display="block">
                클릭 몇 번만으로 여러 언어로 된 파워포인트를 생성할 수 있습니다.
              </Typography>
            </Box>
          </Paper>
        </Box>
        
        <Box mb={5}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            추가 특징
          </Typography>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box mb={3}>
                  <Box display="flex" alignItems="center">
                    <ExtensionIcon color="primary" />
                    <Typography variant="h6" ml={1} fontWeight="medium">다양한 언어 지원</Typography>
                  </Box>
                  <Typography variant="body2" mt={1}>
                    한국어에서 영어, 베트남어, 중국어 등 다양한 언어로의 번역뿐만 아니라, 베트남어에서 일본어 등 언어 간 자유로운 번역이 가능합니다.
                  </Typography>
                </Box>
                <Box>
                  <Box display="flex" alignItems="center">
                    <SecurityIcon color="primary" />
                    <Typography variant="h6" ml={1} fontWeight="medium">보안 강화</Typography>
                  </Box>
                  <Typography variant="body2" mt={1}>
                    내부 문서의 안전한 처리를 보장하며, 승인된 사용자만 접근 가능한 보안 시스템을 갖추고 있습니다.
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box mb={3}>
                  <Box display="flex" alignItems="center">
                    <TableChartIcon color="primary" />
                    <Typography variant="h6" ml={1} fontWeight="medium">대용량 문서 처리</Typography>
                  </Box>
                  <Typography variant="body2" mt={1}>
                  100페이지 이상의 대용량 파일도 효율적으로 처리할 수 있도록 시스템이 최적화되어 있습니다.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        <Box mb={5}>
          <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
            활용 방안
          </Typography>
          <Box mt={2}>
            <Typography variant="body1" paragraph>
              글로벌 마케팅 자료 제작, 다국어 매뉴얼 번역 등 다양한 업무에 활용하여 생산성을 높일 수 있습니다.
            </Typography>
            <Typography variant="body1">
              <strong>바로 사용해보세요!</strong> '번역하기' 메뉴의 '사용' 항목에서 직접 번역 기능을 이용할 수 있습니다.
            </Typography>
          </Box>
        </Box>
      </Container>
    </MainLayout>
  );
};

export default IntroductionPage;
