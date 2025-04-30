import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { 
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [tabValue, setTabValue] = useState(0);
  
  // 프로필 폼 상태
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    department: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // 비밀번호 변경 대화상자 상태
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // 세션 데이터가 로드되면 프로필 데이터 초기화
  React.useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        department: session.user.department || '',
      }));
    }
  }, [session]);

  // 로딩 중이면 로딩 인디케이터 표시
  if (status === 'loading' || !session) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 프로필 편집 모드 토글
  const toggleEditMode = () => {
    if (editMode) {
      // 편집 모드 종료 시 원래 데이터로 복원
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || '',
        department: session.user.department || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    }
    setEditMode(!editMode);
  };

  // 비밀번호 대화상자 열기
  const handleOpenPasswordDialog = () => {
    setPasswordDialogOpen(true);
  };

  // 비밀번호 대화상자 닫기
  const handleClosePasswordDialog = () => {
    setProfileData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
    setPasswordDialogOpen(false);
  };

  // 프로필 업데이트 제출
  const handleSubmitProfile = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          department: profileData.department,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '프로필 업데이트 실패');
      }

      const updatedUser = await response.json();
      
      // 세션 업데이트
      await update({
        ...session,
        user: {
          ...session.user,
          name: updatedUser.name,
          department: updatedUser.department,
        },
      });

      setMessage({
        type: 'success',
        text: '프로필이 성공적으로 업데이트되었습니다.',
      });
      
      setEditMode(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 비밀번호 변경 제출
  const handleChangePassword = async () => {
    // 비밀번호 유효성 검사
    if (profileData.newPassword !== profileData.confirmPassword) {
      setMessage({
        type: 'error',
        text: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '비밀번호 변경 실패');
      }

      setMessage({
        type: 'success',
        text: '비밀번호가 성공적으로 변경되었습니다.',
      });
      
      handleClosePasswordDialog();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ISO 날짜 문자열을 한국어 형식으로 변환
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <ProtectedRoute>
      <MainLayout title="내 프로필">
        <Container maxWidth="md">
          {message.text && (
            <Alert 
              severity={message.type as 'success' | 'error' | 'info' | 'warning'} 
              sx={{ mb: 3 }}
              onClose={() => setMessage({ type: '', text: '' })}
            >
              {message.text}
            </Alert>
          )}

          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: 'primary.main',
                    fontSize: '2rem',
                    mr: 3,
                  }}
                >
                  {session.user.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {session.user.name}
                  </Typography>
                  <Typography variant="body1" color="textSecondary">
                    {session.user.department}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <CloseIcon /> : <EditIcon />}
                onClick={toggleEditMode}
                disabled={isLoading}
              >
                {editMode ? '편집 취소' : '프로필 편집'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
                <Tab label="프로필 정보" />
                <Tab label="계정 보안" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {editMode ? (
                <Box component="form" noValidate>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        id="name"
                        label="이름"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        required
                        fullWidth
                        id="department"
                        label="부서"
                        name="department"
                        value={profileData.department}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmitProfile}
                      disabled={isLoading}
                    >
                      {isLoading ? '저장 중...' : '변경사항 저장'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <List>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText
                      primary="아이디"
                      secondary={session.user.userId}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText
                      primary="이름"
                      secondary={session.user.name}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                  
                  <ListItem sx={{ py: 1 }}>
                    <ListItemText
                      primary="부서"
                      secondary={session.user.department}
                      primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                      secondaryTypographyProps={{ variant: 'body1' }}
                    />
                  </ListItem>
                </List>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <List>
                <ListItem sx={{ py: 1 }}>
                  <ListItemText
                    primary="비밀번호"
                    secondary="******"
                    primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleOpenPasswordDialog}
                  >
                    변경
                  </Button>
                </ListItem>
                
                <ListItem sx={{ py: 1 }}>
                  <ListItemText
                    primary="API 키 상태"
                    secondary={
                      session.user.apiKey ? (
                        <Chip 
                          label="발급됨" 
                          color="success" 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      ) : (
                        <Chip 
                          label="미발급" 
                          color="error" 
                          size="small" 
                          sx={{ mt: 0.5 }}
                        />
                      )
                    }
                    primaryTypographyProps={{ variant: 'subtitle2', color: 'textSecondary' }}
                  />
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      startIcon={<KeyIcon />}
                      onClick={() => router.push('/admin/api-keys')}
                      disabled={!session?.user?.isAdmin}
                    >
                      API 키 관리
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      {session?.user?.isAdmin ? '관리자용 기능입니다.' : '관리자만 접근할 수 있는 기능입니다.'}
                    </Typography>
                  </Box>
                </ListItem>
              </List>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  API 키는 관리자에 의해서만 발급되고 관리됩니다.
                </Typography>
              </Box>
            </TabPanel>
          </Paper>
        </Container>
      </MainLayout>
      
      {/* 비밀번호 변경 대화상자 */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog}>
        <DialogTitle>비밀번호 변경</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            새 비밀번호를 설정하려면 현재 비밀번호를 입력한 후 새 비밀번호를 입력하세요.
          </DialogContentText>
          <TextField
            margin="dense"
            id="currentPassword"
            name="currentPassword"
            label="현재 비밀번호"
            type="password"
            fullWidth
            required
            variant="outlined"
            value={profileData.currentPassword}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="newPassword"
            name="newPassword"
            label="새 비밀번호"
            type="password"
            fullWidth
            required
            variant="outlined"
            value={profileData.newPassword}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="confirmPassword"
            name="confirmPassword"
            label="새 비밀번호 확인"
            type="password"
            fullWidth
            required
            variant="outlined"
            value={profileData.confirmPassword}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} color="inherit">
            취소
          </Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary" 
            variant="contained"
            disabled={isLoading || !profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword}
          >
            {isLoading ? '처리 중...' : '비밀번호 변경'}
          </Button>
        </DialogActions>
      </Dialog>
    </ProtectedRoute>
  );
};

export default Profile;
