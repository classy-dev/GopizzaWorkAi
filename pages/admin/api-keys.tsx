import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  VpnKey as KeyIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Tooltip,
  Snackbar,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

interface User {
  id: string;
  name: string;
  userId: string;
  department: string;
  apiKey: string | null;
  isAdmin: boolean;
}

const ApiKeyManagement = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'generate' | 'revoke'>('generate');
  const [showApiKey, setShowApiKey] = useState<{ [key: string]: boolean }>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [newApiKey, setNewApiKey] = useState('');

  // 사용자 목록 불러오기
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 정보를 가져오는데 실패했습니다.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session]);

  // 로딩 중이면 로딩 인디케이터 표시
  if (status === 'loading' || loading) {
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

  // API 키 생성 또는 갱신 대화상자 열기
  const handleOpenGenerateDialog = (user: User) => {
    setSelectedUser(user);
    setDialogAction('generate');
    setNewApiKey('');
    setDialogOpen(true);
  };

  // API 키 삭제 대화상자 열기
  const handleOpenRevokeDialog = (user: User) => {
    setSelectedUser(user);
    setDialogAction('revoke');
    setDialogOpen(true);
  };

  // 대화상자 닫기
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setNewApiKey('');
  };

  // API 키 복사
  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setSnackbar({ open: true, message: 'API 키가 클립보드에 복사되었습니다.' });
  };

  // API 키 표시/숨김 토글
  const toggleApiKeyVisibility = (userId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // 스낵바 닫기
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // API 키 생성 또는 갱신
  const handleGenerateApiKey = async () => {
    if (!selectedUser || !newApiKey.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: selectedUser.id,
          apiKey: newApiKey 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 키 생성에 실패했습니다.');
      }

      const updatedUser = await response.json();
      
      // 사용자 목록 업데이트
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? { ...user, apiKey: updatedUser.apiKey } : user
        )
      );

      // API 키를 표시 상태로 설정
      setShowApiKey(prev => ({
        ...prev,
        [updatedUser.id]: true,
      }));

      setSnackbar({ open: true, message: `${updatedUser.name}님의 API 키가 설정되었습니다.` });
      handleCloseDialog();
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // API 키 삭제
  const handleRevokeApiKey = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 키 삭제에 실패했습니다.');
      }

      const updatedUser = await response.json();
      
      // 사용자 목록 업데이트
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? { ...user, apiKey: null } : user
        )
      );

      setSnackbar({ open: true, message: `${updatedUser.name}님의 API 키가 삭제되었습니다.` });
      handleCloseDialog();
    } catch (error) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  // API 키를 가리거나 표시하는 마스킹 함수
  const maskApiKey = (apiKey: string | null, userId: string) => {
    if (!apiKey) return null;
    
    return showApiKey[userId] 
      ? apiKey 
      : `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  };

  return (
    <ProtectedRoute>
      <MainLayout title="API 키 관리">
        <Container maxWidth="lg">
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" component="h1">
                사용자 API 키 관리
              </Typography>
              <Button 
                startIcon={<RefreshIcon />} 
                variant="outlined"
                onClick={fetchUsers}
              >
                새로고침
              </Button>
            </Box>

            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>이름</TableCell>
                    <TableCell>아이디</TableCell>
                    <TableCell>부서</TableCell>
                    <TableCell>API 키</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell align="right">작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell component="th" scope="row">
                          {user.name}
                          {user.isAdmin && (
                            <Chip 
                              label="관리자" 
                              color="primary" 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>{user.userId}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          {user.apiKey ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  bgcolor: 'action.hover',
                                  p: 0.5,
                                  borderRadius: 1,
                                  maxWidth: '250px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {maskApiKey(user.apiKey, user.id)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => toggleApiKeyVisibility(user.id)}
                              >
                                {showApiKey[user.id] ? (
                                  <VisibilityOffIcon fontSize="small" />
                                ) : (
                                  <VisibilityIcon fontSize="small" />
                                )}
                              </IconButton>
                              {showApiKey[user.id] && (
                                <Tooltip title="복사">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopyApiKey(user.apiKey!)}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography color="text.secondary">
                              API 키가 발급되지 않았습니다.
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.apiKey ? (
                            <Chip label="발급됨" color="success" size="small" />
                          ) : (
                            <Chip label="미발급" color="error" size="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<KeyIcon />}
                            onClick={() => handleOpenGenerateDialog(user)}
                            sx={{ mr: 1 }}
                          >
                            {user.apiKey ? '재발급' : '발급'}
                          </Button>
                          {user.apiKey && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleOpenRevokeDialog(user)}
                            >
                              삭제
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        등록된 사용자가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>

        {/* API 키 생성/갱신 대화상자 */}
        <Dialog open={dialogOpen && dialogAction === 'generate'} onClose={handleCloseDialog}>
          <DialogTitle>API 키 {selectedUser?.apiKey ? '재설정' : '설정'}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {selectedUser?.name}님의 API 키를 {selectedUser?.apiKey ? '재설정' : '설정'}합니다.
              {selectedUser?.apiKey && (
                <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                  기존 API 키는 더 이상 사용할 수 없게 됩니다.
                </Typography>
              )}
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="apiKey"
              label="API 키"
              type="text"
              fullWidth
              variant="outlined"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="사용할 API 키를 입력하세요"
              helperText="API 키는 영문과 숫자를 포함하여 설정하는 것을 권장합니다."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              취소
            </Button>
            <Button 
              onClick={handleGenerateApiKey} 
              color="primary" 
              variant="contained"
              disabled={!newApiKey.trim()}
            >
              저장
            </Button>
          </DialogActions>
        </Dialog>

        {/* API 키 삭제 대화상자 */}
        <Dialog open={dialogOpen && dialogAction === 'revoke'} onClose={handleCloseDialog}>
          <DialogTitle>API 키 삭제</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {selectedUser?.name}님의 API 키를 삭제하시겠습니까?
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                삭제 후에는 해당 사용자는 API를 사용할 수 없게 됩니다.
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">
              취소
            </Button>
            <Button onClick={handleRevokeApiKey} color="error" variant="contained">
              삭제
            </Button>
          </DialogActions>
        </Dialog>

        {/* 스낵바 알림 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbar.message}
        />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default ApiKeyManagement;
