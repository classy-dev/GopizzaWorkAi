import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { observer } from 'mobx-react-lite';
import { useSession, signOut } from 'next-auth/react';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  KeyboardArrowDown,
  KeyboardArrowRight,
} from '@mui/icons-material';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  CssBaseline,
  IconButton,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Collapse,
  useMediaQuery, // 반응형 디자인을 위한 추가 import
} from '@mui/material';
import { useStores } from '../../hooks/useStores';

// 메뉴 아이템 하위 아이템 인터페이스
interface MenuItem {
  text: string;
  path: string;
}

// 메뉴 아이템 인터페이스
interface MenuItemWithChildren {
  text: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  path?: string; // 하위 메뉴가 있는 경우에는 path가 없을 수 있음
}

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

const MainLayout: React.FC<MainLayoutProps> = observer(
  ({ children, title = 'AI 다국어 번역기' }) => {
    const { data: session } = useSession();
    const { uiStore } = useStores();
    const theme = useTheme();
    const router = useRouter();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    // 메뉴 펼침/접힘 상태 관리
    const [openMenus, setOpenMenus] = React.useState<{[key: string]: boolean}>({});
    
    // 화면 크기에 따른 반응형 레이아웃을 위한 미디어 쿼리
    // md 사이즈 (960px) 이상일 경우 데스크톱으로 간주
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    
    // 현재 URL에 따라 자동으로 해당 메뉴를 펼치는 효과
    React.useEffect(() => {
      // 메뉴에 하위 메뉴가 있는 경우, URL이 그 하위 항목 중 하나와 일치하는지 확인
      menuItems.forEach(item => {
        if (item.children) {
          // 각 하위 메뉴의 경로와 현재 URL을 비교
          const shouldExpand = item.children.some(
            child => router.pathname.startsWith(child.path)
          );
          
          if (shouldExpand) {
            setOpenMenus(prev => ({
              ...prev,
              [item.text]: true
            }));
          }
        }
      });
      // 경로 변경 시에도 해당 1depth 메뉴가 열린 상태를 유지하도록 함
    }, []); // 최초 로드시에만 실행하도록 빈 의존성 배열 사용

    const toggleDrawer = () => {
      uiStore.toggleDrawer();
    };

    const toggleDarkMode = () => {
      uiStore.toggleDarkMode();
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleLogout = async () => {
      handleMenuClose();
      await signOut({ redirect: false });
      router.push('/');
    };
    
    // 하위 메뉴가 있는 메뉴 항목의 펼침/접힘 상태를 토글하는 함수
    const toggleMenu = (menuText: string, event: React.MouseEvent) => {
      event.stopPropagation(); // 상위 요소로 이벤트 전파 방지
      setOpenMenus(prev => ({
        ...prev,
        [menuText]: !prev[menuText]
      }));
    };

    const menuItems: MenuItemWithChildren[] = [
      { 
        text: '번역하기', 
        icon: <GTranslateIcon />, 
        children: [
          { text: '소개', path: '/ai-translate' },
          { text: '사용', path: '/ai-translate/use' }
        ]
      },
      { text: '설정', icon: <SettingsIcon />, path: '/settings' },
      { text: '정보', icon: <InfoIcon />, path: '/about' },
    ];

    // 관리자 전용 메뉴 아이템
    const adminMenuItems: MenuItemWithChildren[] = [
      { text: 'API 키 관리', icon: <SettingsIcon />, path: '/admin/api-keys' },
      { text: '사용자 활동 로그', icon: <HomeIcon />, path: '/admin/usage-logs' },
    ];

    const drawer = (
      <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" component="div">
            PDF 글로벌 번역기
          </Typography>
          {session && (
            <Typography variant="body2" color="text.secondary">
              {session.user.name} ({session.user.department})
            </Typography>
          )}
        </Box>
        <Divider />
        <List>
          {menuItems.map(item => (
            <React.Fragment key={item.text}>
              {/* 하위 메뉴가 있는 항목 */}
              {item.children ? (
                <>
                  <ListItem disablePadding>
                    <Box
                      component="div"
                      onClick={(e) => toggleMenu(item.text, e)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        width: '100%',
                        bgcolor:
                          router.pathname.startsWith(item.children[0].path.split('/').slice(0, -1).join('/'))
                            ? theme.palette.action.selected
                            : 'transparent',
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        cursor: 'pointer',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                      </Box>
                      {openMenus[item.text] ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                    </Box>
                  </ListItem>
                  <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {item.children.map((child) => (
                        <ListItem key={child.text} disablePadding>
                          <Link
                            href={child.path || '#'}
                            passHref
                            style={{
                              textDecoration: 'none',
                              color: 'inherit',
                              width: '100%',
                            }}
                          >
                            <Box
                              component="div"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                pl: 4, // 들여쓰기 추가
                                pr: 2,
                                py: 1,
                                width: '100%',
                                bgcolor:
                                  router.pathname === child.path
                                    ? theme.palette.action.selected
                                    : 'transparent',
                                textDecoration: router.pathname === child.path ? 'underline' : 'none',
                                textUnderlineOffset: '3px',
                                '&:hover': { bgcolor: theme.palette.action.hover },
                                cursor: 'pointer',
                              }}
                            >
                              <ListItemText primary={child.text} />
                            </Box>
                          </Link>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding>
                  <Link
                    href={item.path || '#'} /* 경로가 없는 경우 기본값 제공 */
                    passHref
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      width: '100%',
                    }}
                  >
                    <Box
                      component="div"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        width: '100%',
                        bgcolor:
                          router.pathname === item.path
                            ? theme.palette.action.selected
                            : 'transparent',
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        cursor: 'pointer',
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </Box>
                  </Link>
                </ListItem>
              )}
            </React.Fragment>
          ))}
          {session && (
            <ListItem disablePadding>
              <Box
                component="div"
                onClick={handleLogout}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1,
                  width: '100%',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                  cursor: 'pointer',
                }}
              >
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="로그아웃" />
              </Box>
            </ListItem>
          )}
        </List>

        {/* 관리자 전용 메뉴 섹션 */}
        {session?.user?.isAdmin && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                관리자 메뉴
              </Typography>
            </Box>
            <List>
              {adminMenuItems.map(item => (
                <ListItem key={item.text} disablePadding>
                  <Link
                    href={item.path || '#'}
                    passHref
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      width: '100%',
                    }}
                  >
                    <Box
                      component="div"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        width: '100%',
                        bgcolor:
                          router.pathname === item.path
                            ? theme.palette.action.selected
                            : 'transparent',
                        '&:hover': { bgcolor: theme.palette.action.hover },
                        cursor: 'pointer',
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </Box>
                  </Link>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    );

    return (
      <>
        <CssBaseline />
        <AppBar 
          position="fixed"
          elevation={isDesktop ? 0 : 4}
          sx={{
            // 데스크톱에서는 사이드바 너비만큼 AppBar 너비 조정
            ...(isDesktop && {
              width: `calc(100% - 250px)`,
              ml: '250px',
              bgcolor: '#ffffff',
              color: '#0a3b41',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            })
          }}
        >
          <Toolbar>
            {/* 데스크톱에서는 메뉴 버튼 감추기 */}
            {!isDesktop && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={toggleDrawer}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
            
            {session && (
              <>
                <Tooltip title="계정 설정">
                  <IconButton onClick={handleMenuOpen} color="inherit">
                    <Avatar
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: theme.palette.primary.main,
                        fontSize: '1rem'
                      }}
                    >
                      {session.user.name?.charAt(0)}
                    </Avatar>
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={() => {
                    handleMenuClose();
                    router.push('/profile');
                  }}>
                    <ListItemIcon>
                      <AccountIcon fontSize="small" />
                    </ListItemIcon>
                    내 프로필
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    로그아웃
                  </MenuItem>
                </Menu>
              </>
            )}
            
            {/* <IconButton color="inherit" onClick={toggleDarkMode}>
              {theme.palette.mode === 'dark' ? (
                <LightModeIcon />
              ) : (
                <DarkModeIcon />
              )}
            </IconButton> */}
          </Toolbar>
        </AppBar>

        {/* 데스크톱에서는 영구적인 사이드바 표시, 모바일에서는 토글 가능한 Drawer */}
        {isDesktop ? (
          // 데스크톱용 고정 사이드바
          <Box
            sx={{
              width: 250,
              flexShrink: 0,
              position: 'fixed',
              left: 0,
              top: 0,
              height: '100vh',
              bgcolor: '#0a3b41', // 이미지에 맞는 짙은 녹색/청록색 계열
              color: 'common.white',
              zIndex: (theme) => theme.zIndex.drawer,
              borderRight: '1px solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* 사이드바 로고 영역 */}
            <Box 
              sx={{ 
                p: 3, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 2
              }}
            >
              <Typography 
                variant="h5" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#fff',
                  letterSpacing: '0.5px'
                }}
              >
                GOPIZZA WorkUp AI
              </Typography>
            </Box>
            
            {/* 사용자 프로필 영역 */}
            {session && (
              <Box 
                sx={{ 
                  px: 3, 
                  py: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  mb: 3
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#62e3d5', 
                    color: '#0a3b41',
                    width: 40, 
                    height: 40,
                    mr: 2 
                  }}
                >
                  {session.user.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: '#fff' }}>
                    {session.user.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {session.user.department}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* 메뉴 영역 - 기존 drawer 내용을 사용하지 않고 새로 스타일링 */}
            <List sx={{ px: 2 }}>
              {menuItems.map(item => (
                <React.Fragment key={item.text}>
                  {/* 하위 메뉴가 있는 항목 */}
                  {item.children ? (
                    <>
                      <ListItem disablePadding sx={{ mb: 1 }}>
                        <Box
                          component="div"
                          onClick={(e) => toggleMenu(item.text, e)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            width: '100%',
                            borderRadius: '8px',
                            bgcolor:
                              router.pathname.startsWith(item.children[0].path.split('/').slice(0, -1).join('/'))
                                ? 'rgba(98, 227, 213, 0.2)'
                                : 'transparent',
                            '&:hover': { 
                              bgcolor: 'rgba(98, 227, 213, 0.1)',
                              transition: 'all 0.3s ease'
                            },
                            cursor: 'pointer',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ListItemIcon sx={{ minWidth: 40, color: router.pathname.startsWith('/ai-translate') ? '#62e3d5' : 'rgba(255, 255, 255, 0.7)' }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText 
                              primary={item.text} 
                              primaryTypographyProps={{ 
                                fontSize: '0.95rem',
                                fontWeight: router.pathname.startsWith('/ai-translate') ? 'medium' : 'normal',
                                color: router.pathname.startsWith('/ai-translate') ? '#62e3d5' : '#fff'
                              }} 
                            />
                          </Box>
                          {openMenus[item.text] ? 
                            <KeyboardArrowDown sx={{ color: 'rgba(255, 255, 255, 0.7)' }} /> : 
                            <KeyboardArrowRight sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          }
                        </Box>
                      </ListItem>
                      <Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {item.children.map((child) => (
                            <ListItem key={child.text} disablePadding sx={{ pl: 2 }}>
                              <Link
                                href={child.path || '#'}
                                passHref
                                style={{
                                  textDecoration: 'none',
                                  color: 'inherit',
                                  width: '100%',
                                }}
                              >
                                <Box
                                  component="div"
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    pl: 4,
                                    pr: 2,
                                    py: 1,
                                    width: '100%',
                                    borderRadius: '8px',
                                    color: router.pathname === child.path ? '#62e3d5' : '#fff',
                                    textDecoration: router.pathname === child.path ? 'underline' : 'none',
                                    textUnderlineOffset: '3px',
                                    '&:hover': { 
                                      bgcolor: 'rgba(98, 227, 213, 0.1)',
                                      transition: 'all 0.3s ease'
                                    },
                                    cursor: 'pointer',
                                  }}
                                >
                                  <ListItemText 
                                    primary={child.text} 
                                    primaryTypographyProps={{ 
                                      fontSize: '0.95rem',
                                      fontWeight: router.pathname === child.path ? 'medium' : 'normal',
                                      color: router.pathname === child.path ? '#62e3d5' : '#fff',
                                    }} 
                                  />
                                </Box>
                              </Link>
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </>
                  ) : (
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <Link
                        href={item.path || '#'}
                        passHref
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          width: '100%',
                        }}
                      >
                        <Box
                          component="div"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            width: '100%',
                            borderRadius: '8px',
                            bgcolor:
                              router.pathname === item.path
                                ? 'rgba(98, 227, 213, 0.2)'
                                : 'transparent',
                            '&:hover': { 
                              bgcolor: 'rgba(98, 227, 213, 0.1)',
                              transition: 'all 0.3s ease'
                            },
                            cursor: 'pointer',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: router.pathname === item.path ? '#62e3d5' : 'rgba(255, 255, 255, 0.7)' }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={item.text} 
                            primaryTypographyProps={{ 
                              fontSize: '0.95rem',
                              fontWeight: router.pathname === item.path ? 'medium' : 'normal',
                              color: router.pathname === item.path ? '#62e3d5' : '#fff'
                            }} 
                          />
                        </Box>
                      </Link>
                    </ListItem>
                  )}
                </React.Fragment>
              ))}
              
              {/* 로그아웃 버튼 */}
              {session && (
                <ListItem disablePadding sx={{ mt: 2 }}>
                  <Box
                    component="div"
                    onClick={handleLogout}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      py: 1.5,
                      width: '100%',
                      borderRadius: '8px',
                      '&:hover': { 
                        bgcolor: 'rgba(255, 77, 77, 0.1)',
                        transition: 'all 0.3s ease'
                      },
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: 'rgba(255, 255, 255, 0.7)' }}>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="로그아웃" 
                      primaryTypographyProps={{ 
                        fontSize: '0.95rem',
                        color: '#fff'
                      }} 
                    />
                  </Box>
                </ListItem>
              )}
            </List>
            
            {/* 관리자 메뉴 영역 */}
            {session?.user?.isAdmin && (
              <>
                <Box sx={{ px: 3, py: 2, mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 'medium', letterSpacing: '0.5px' }}>
                    관리자 메뉴
                  </Typography>
                </Box>
                <List sx={{ px: 2 }}>
                  {adminMenuItems.map(item => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                      <Link
                        href={item.path || '#'}
                        passHref
                        style={{
                          textDecoration: 'none',
                          color: 'inherit',
                          width: '100%',
                        }}
                      >
                        <Box
                          component="div"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            width: '100%',
                            borderRadius: '8px',
                            bgcolor:
                              router.pathname === item.path
                                ? 'rgba(98, 227, 213, 0.2)'
                                : 'transparent',
                            '&:hover': { 
                              bgcolor: 'rgba(98, 227, 213, 0.1)',
                              transition: 'all 0.3s ease'
                            },
                            cursor: 'pointer',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40, color: router.pathname === item.path ? '#62e3d5' : 'rgba(255, 255, 255, 0.7)' }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={item.text} 
                            primaryTypographyProps={{ 
                              fontSize: '0.95rem',
                              fontWeight: router.pathname === item.path ? 'medium' : 'normal',
                              color: router.pathname === item.path ? '#62e3d5' : '#fff'
                            }} 
                          />
                        </Box>
                      </Link>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        ) : (
          // 모바일용 토글 가능한 Drawer
          <Drawer anchor="left" open={uiStore.isDrawerOpen} onClose={toggleDrawer}>
            {drawer}
          </Drawer>
        )}

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: 8, // Account for the AppBar height
            minHeight: '100vh',
            bgcolor: isDesktop ? '#f4f7fa' : 'background.default', // 데스크톱에서는 조금 더 밝은 배경색
            color: 'text.primary',
            // 데스크톱에서는 사이드바 너비만큼 왼쪽 여백 추가
            ...(isDesktop && {
              ml: '250px',
              p: 0, // 컨테이너에서 패딩을 주기 위해 이쪽에서는 패딩 제거
            }),
          }}
        >
          <Container 
            maxWidth="lg" 
            sx={{ 
              py: 12,
              ...(isDesktop && {
                px: 4,  // 데스크톱에서 여백 조정
                maxWidth: '100%', // 데스크톱에서는 컨테이너 제한 없이 사용
              })
            }}
          >
            {children}
          </Container>
        </Box>
      </>
    );
  }
);

export default MainLayout;
