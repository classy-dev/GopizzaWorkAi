/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import type { Metadata } from 'next';

// --- Styled Components (Reusing existing styles) ---
const colors = {
  gray50: '#f9fafb',
  gray700: '#374151',
  gray900: '#11182c',
  white: '#ffffff',
  indigo600: '#4f46e5',
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
`;

const ContentContainer = styled.div`
  max-width: 48rem;
  width: 100%;
  background-color: ${colors.white};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-radius: 0.375rem;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: ${colors.gray900};
  margin-bottom: 1.5rem;
`;

const Paragraph = styled.p`
  color: ${colors.gray700};
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const EmailLink = styled.a`
  color: ${colors.indigo600};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const Footer = styled.footer`
  margin-top: 3rem;
  text-align: center;
  color: ${colors.gray50};
  font-size: 0.875rem;
`;

// --- Component ---

export const metadata: Metadata = {
  title: '슬라이드 번역기 지원',
  description: '슬라이드 번역기 Google Workspace 부가기능 지원 안내',
};

export default function SupportPage() {
  const currentYear = new Date().getFullYear();
  const developerName = "윤은석 (Eunseok Yun)"; // Replace with your actual name
  const supportEmail = "familyman801205@gmail.com"; // Your provided support email

  return (
    <PageWrapper>
      <ContentContainer>
        <Title>지원</Title>
        <Paragraph>
          슬라이드 번역기 사용 중 문제가 발생하신 경우, 아래 이메일 주소로 해당 문제를 자세히 알려주시면 최선을 다해 도와드리겠습니다.
        </Paragraph>
        <Paragraph>
          이메일 문의: <EmailLink href={`mailto:${supportEmail}`}>{supportEmail}</EmailLink>
        </Paragraph>
      </ContentContainer>
      <Footer>
        © {currentYear} {developerName}. All rights reserved.
      </Footer>
    </PageWrapper>
  );
}