import React, { ReactNode } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  minHeight?: string | number;
  elevation?: number;
  borderColor?: string;
  headerBg?: string;
}

// 스타일이 적용된 Paper 컴포넌트
const StyledCard = styled(Paper)(({ theme }) => ({
  overflow: 'hidden',
  borderRadius: '12px',
  transition: 'all 0.2s ease-in-out',

}));

// 헤더 컴포넌트
const CardHeader = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

// 아이콘 컨테이너
const IconContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  width: '42px',
  height: '42px',
  marginRight: theme.spacing(2),
  flexShrink: 0,
}));

// 컨텐츠 영역
const CardContent = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
}));

// 푸터 영역
const CardFooter = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  icon,
  children,
  footer,
  minHeight = 'auto',
  elevation = 1,
  borderColor,
  headerBg = 'transparent',
}) => {
  return (
    <StyledCard 
      elevation={elevation} 
      sx={{
        minHeight,
        border: borderColor ? `1px solid ${borderColor}` : 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {(title || icon) && (
        <CardHeader sx={{ bgcolor: headerBg }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon && (
              <IconContainer sx={{ bgcolor: 'rgba(98, 227, 213, 0.1)', color: '#0a3b41' }}>
                {icon}
              </IconContainer>
            )}
            <Box>
              {title && (
                <Typography variant="h6" sx={{ fontWeight: 'medium', fontSize: '1.1rem' }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        </CardHeader>
      )}
      <CardContent sx={{ flexGrow: 1 }}>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  );
};

export default Card;
