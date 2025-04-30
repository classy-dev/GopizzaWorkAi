/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import type { Metadata } from 'next';

// --- Styled Components (Reusing from the landing page or defining new ones) ---

// Basic color palette (approximating Tailwind) - Assuming you have this defined
const colors = {
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#11182c',
  white: '#ffffff',
  indigo600: '#4f46e5',
  // ... add any other colors you need
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const ContentContainer = styled.div`
  max-width: 48rem;
  width: 100%;
  background-color: ${colors.white};
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border-radius: 0.375rem;
  padding: 2rem;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: ${colors.gray900};
  margin-bottom: 1.5rem;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${colors.gray800};
  margin-top: 2rem;
  margin-bottom: 1rem;
`;

const Paragraph = styled.p`
  color: ${colors.gray700};
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const List = styled.ul`
  list-style-type: disc;
  margin-left: 1.5rem;
  color: ${colors.gray700};
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const ListItem = styled.li`
  margin-bottom: 0.5rem;
`;

const Footer = styled.footer`
  margin-top: 3rem;
  text-align: center;
  color: ${colors.gray500};
  font-size: 0.875rem;
`;

// --- Component ---

export const metadata: Metadata = {
  title: '슬라이드 번역기 서비스 약관',
  description: '슬라이드 번역기 Google Workspace 부가기능 서비스 약관',
};

export default function TermsOfServicePage() {
  const currentYear = new Date().getFullYear();
  const developerName = "윤은석 (Eunseok Yun)"; // Replace with your actual name

  return (
    <PageWrapper>
      <ContentContainer>
        <Title>슬라이드 번역기 서비스 약관</Title>

        <SectionTitle>1. 약관 동의</SectionTitle>
        <Paragraph>
          슬라이드 번역기 Google Workspace 부가기능("본 서비스")을 이용함으로써 귀하는 본 서비스 약관("약관")에 동의하는 것으로 간주됩니다. 본 약관을 주의 깊게 읽어보시기 바랍니다.
        </Paragraph>

        <SectionTitle>2. 서비스 내용</SectionTitle>
        <Paragraph>
          본 서비스는 Google 슬라이드 프레젠테이션 내의 텍스트, 도형, 표, 발표자 노트, 마스터 및 레이아웃 텍스트를 사용자가 선택한 언어로 번역하는 기능을 제공합니다. 번역은 Google 번역 API를 기반으로 제공됩니다.
        </Paragraph>

        <SectionTitle>3. 이용 조건</SectionTitle>
        <List>
          <ListItem>본 서비스는 Google Workspace 계정을 가진 사용자만 이용할 수 있습니다.</ListItem>
          <ListItem>본 서비스 이용 시 발생하는 Google API 사용량에 대한 책임은 사용자에게 있습니다.</ListItem>
          <ListItem>본 서비스는 현재 상태로 제공되며, 개발자는 서비스의 완전성, 정확성, 또는 특정 목적에의 적합성을 보장하지 않습니다.</ListItem>
        </List>

        <SectionTitle>4. 개인정보 처리방침</SectionTitle>
        <Paragraph>
          본 서비스는 사용자의 Google 슬라이드 콘텐츠를 저장하거나 외부로 전송하지 않습니다. 번역 과정은 Google API를 통해 이루어지며, 사용자의 콘텐츠는 번역 목적으로만 임시적으로 처리됩니다. 더 자세한 내용은 <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">개인정보 처리방침</a>을 참고하시기 바랍니다.
        </Paragraph>

        <SectionTitle>5. 책임의 제한</SectionTitle>
        <Paragraph>
          개발자는 본 서비스 이용으로 인해 발생하는 직간접적인 손해에 대해 책임을 지지 않습니다. 특히 번역 결과의 부정확성으로 인해 발생하는 문제에 대해서는 책임을 지지 않습니다. 중요한 문서의 번역 결과는 반드시 검토하시기 바랍니다.
        </Paragraph>

        <SectionTitle>6. 약관의 변경</SectionTitle>
        <Paragraph>
          개발자는 필요에 따라 본 약관을 사전 통지 없이 변경할 수 있습니다. 변경된 약관은 본 페이지에 게시됨과 동시에 효력이 발생합니다.
        </Paragraph>

        <SectionTitle>7. 준거법</SectionTitle>
        <Paragraph>
          본 약관은 대한민국 법률에 따라 규율되고 해석됩니다.
        </Paragraph>

        <Footer>
          © {currentYear} {developerName}. All rights reserved.
        </Footer>
      </ContentContainer>
    </PageWrapper>
  );
}