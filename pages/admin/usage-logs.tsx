import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';

interface User {
  name: string;
  department: string;
  userId: string;
}

interface UsageLog {
  id: string;
  userId: string;
  menuName: string;
  usageTime: string;
  documentName: string | null;
  documentLength: number | null;
  user: User;
}

interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

interface UsageResponse {
  data: UsageLog[];
  pagination: PaginationInfo;
}

const UsageLogs = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [menuFilter, setMenuFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState<{id: string, name: string}[]>([]);

  // 사용 로그 데이터 불러오기
  const fetchUsageLogs = async (page = 1, limit = 10, userId = '') => {
    setLoading(true);
    try {
      // API 요청 파라미터 구성
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (userId) {
        params.append('userId', userId);
      }
      
      const response = await fetch(`/api/admin/usage-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('데이터를 불러오는 중 오류가 발생했습니다');
      }
      
      const data: UsageResponse = await response.json();
      setUsageLogs(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('사용 로그 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 목록 불러오기 (필터링용)
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        throw new Error('사용자 목록을 불러오는 중 오류가 발생했습니다');
      }
      
      const data = await response.json();
      setUsers(data.map((user: any) => ({
        id: user.id,
        name: `${user.name} (${user.userId})`
      })));
    } catch (error) {
      console.error('사용자 목록 조회 중 오류:', error);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    if (session?.user && !isLoading) {
      fetchUsageLogs(pagination.currentPage, pagination.limit, userFilter);
      fetchUsers();
    }
  }, [session]);

  // 필터 변경 시 데이터 다시 로딩
  useEffect(() => {
    if (session?.user && !isLoading) {
      fetchUsageLogs(1, pagination.limit, userFilter);
    }
  }, [userFilter]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    fetchUsageLogs(newPage + 1, pagination.limit, userFilter);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    fetchUsageLogs(1, newLimit, userFilter);
  };

  // 사용자 필터 변경 핸들러
  const handleUserFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setUserFilter(event.target.value as string);
  };

  // 검색어 필터링
  const filteredLogs = usageLogs.filter(log => {
    const matchesSearch = searchTerm 
      ? (log.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         log.user.userId.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;
      
    const matchesMenu = menuFilter
      ? log.menuName === menuFilter
      : true;
      
    return matchesSearch && matchesMenu;
  });

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // 파일 크기 포맷팅 함수
  const formatFileSize = (size: number | null) => {
    if (size === null) return '-';
    
    if (size < 1000) return `${size} 자`;
    if (size < 1000000) return `${(size / 1000).toFixed(1)} K자`;
    return `${(size / 1000000).toFixed(1)} M자`;
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            사용자 활동 로그
          </Typography>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="검색"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="문서명, 사용자명 검색..."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>메뉴 필터</InputLabel>
                  <Select
                    value={menuFilter}
                    onChange={(e) => setMenuFilter(e.target.value as string)}
                    label="메뉴 필터"
                  >
                    <MenuItem value="">전체</MenuItem>
                    <MenuItem value="번역">번역</MenuItem>
                    {/* 추후 다른 메뉴가 추가되면 여기에 추가 */}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>사용자 필터</InputLabel>
                  <Select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value as string)}
                    label="사용자 필터"
                  >
                    <MenuItem value="">전체 사용자</MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          <Paper>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>사용 시간</TableCell>
                        <TableCell>사용자</TableCell>
                        <TableCell>부서</TableCell>
                        <TableCell>메뉴</TableCell>
                        <TableCell>문서명</TableCell>
                        <TableCell>문서 크기</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{formatDate(log.usageTime)}</TableCell>
                            <TableCell>{log.user.name} ({log.user.userId})</TableCell>
                            <TableCell>{log.user.department}</TableCell>
                            <TableCell>
                              <Chip
                                label={log.menuName}
                                color={log.menuName === '번역' ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{log.documentName || '-'}</TableCell>
                            <TableCell>{formatFileSize(log.documentLength)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            조회된 사용 로그가 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={pagination.totalCount}
                  rowsPerPage={pagination.limit}
                  page={pagination.currentPage - 1}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="페이지당 행:"
                  labelDisplayedRows={({ from, to, count }) =>
                    `${from}-${to} / ${count}`
                  }
                />
              </>
            )}
          </Paper>
        </Box>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default UsageLogs;
