/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import type { Metadata } from 'next';

// --- 스타일 컴포넌트 (terms-of-service 페이지에서 재사용하거나 새로 정의) ---
const colors = {
  gray50: '#f9fafb',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#11182c',
  white: '#ffffff',
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
  color: ${colors.gray50};
  font-size: 0.875rem;
`;

// --- 컴포넌트 ---

export const metadata: Metadata = {
  title: '슬라이드 번역기 개인정보 처리방침',
  description: '슬라이드 번역기 Google Workspace 부가기능 개인정보 처리방침',
};

export default function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear();
  const developerName = "윤은석 (Eunseok Yun)"; // 실제 개발자 이름으로 변경
  const contactEmail = "familyman801205@gmail.com"; // 실제 문의 이메일 주소로 변경

  return (
    <PageWrapper>
      <ContentContainer>
        <Title>슬라이드 번역기 개인정보 처리방침</Title>

        <Paragraph>
          본 개인정보 처리방침은 슬라이드 번역기 Google Workspace 부가기능("본 서비스")이 사용자의 개인 정보를 어떻게 수집, 이용, 보관 및 처리하는지에 대해 설명합니다.
        </Paragraph>

        <SectionTitle>1. 수집하는 개인 정보</SectionTitle>
        <Paragraph>
          본 서비스는 사용자의 Google 슬라이드 콘텐츠를 **저장하거나 외부 서버로 전송하지 않습니다.** 번역 과정은 Google Cloud Translation API를 통해 이루어지며, 사용자의 콘텐츠는 번역 목적으로만 일시적으로 처리됩니다.
        </Paragraph>
        <Paragraph>
          다만, 서비스 이용 과정에서 다음과 같은 정보가 **자동으로 기록될 수 있습니다.**
        </Paragraph>
        <List>
          <ListItem>**이용 기록:** 사용자가 서비스를 사용한 시점, 사용한 기능 등의 기록 (서비스 개선 및 오류 분석 목적)</ListItem>
          <ListItem>**오류 로그:** 서비스 사용 중 발생한 오류 및 관련 정보 (서비스 안정성 확보 및 문제 해결 목적)</ListItem>
        </List>
        <Paragraph>
          **Google Workspace 계정 정보 접근:** 본 서비스는 원활한 서비스 제공을 위해 사용자의 Google Workspace 계정 정보 (예: 이름, 이메일 주소)에 접근할 수 있습니다. 이는 사용자 식별 및 서비스 연동을 위해서만 사용됩니다.
        </Paragraph>

        <SectionTitle>2. 개인 정보의 이용 목적</SectionTitle>
        <Paragraph>
          수집된 정보는 다음과 같은 목적으로 이용됩니다.
        </Paragraph>
        <List>
          <ListItem>사용자가 요청한 번역 기능 제공</ListItem>
          <ListItem>서비스 품질 개선 및 새로운 기능 개발</ListItem>
          <ListItem>서비스 이용 관련 문의사항 처리 및 사용자 지원</ListItem>
          <ListItem>서비스 운영 및 안정성 확보를 위한 오류 분석 및 문제 해결</ListItem>
        </List>

        <SectionTitle>3. 개인 정보의 보관 및 파기</SectionTitle>
        <Paragraph>
          **사용자의 Google 슬라이드 콘텐츠는 본 서비스에 의해 영구적으로 보관되지 않습니다.** 번역 작업 완료 후 즉시 처리됩니다.
        </Paragraph>
        <Paragraph>
          **이용 기록 및 오류 로그**는 서비스 개선 및 분석 목적으로 일정 기간 동안 보관될 수 있으며, 보관 기간 종료 후 안전하게 파기됩니다. 구체적인 보관 기간은 내부 정책에 따릅니다.
        </Paragraph>

        <SectionTitle>4. 개인 정보의 제3자 제공</SectionTitle>
        <Paragraph>
          본 서비스는 사용자의 개인 정보를 **원칙적으로 제3자에게 제공하지 않습니다.** 다만, 법률에 따라 의무적으로 제공해야 하는 경우, 또는 사용자의 명시적인 동의가 있는 경우에는 예외적으로 제공될 수 있습니다.
        </Paragraph>

        <SectionTitle>5. 사용자의 권리</SectionTitle>
        <Paragraph>
          사용자는 자신의 개인 정보에 대해 다음과 같은 권리를 행사할 수 있습니다.
        </Paragraph>
        <List>
          <ListItem>**접근권:** 본 서비스가 어떤 개인 정보를 처리하고 있는지 확인할 권리</ListItem>
          <ListItem>**수정권:** 자신의 개인 정보가 부정확하거나 불완전한 경우 수정할 권리</ListItem>
          <ListItem>**삭제권:** 법률에 따라 자신의 개인 정보를 삭제할 권리</ListItem>
          <ListItem>**처리 정지권:** 특정 목적 또는 방법으로 개인 정보 처리를 정지할 권리</ListItem>
        </List>
        <Paragraph>
          위 권리 행사를 원하시는 경우 아래 연락처로 문의해 주시기 바랍니다.
        </Paragraph>

        <SectionTitle>6. 개인 정보 보호 책임자</SectionTitle>
        <Paragraph>
          개인 정보 보호와 관련된 문의사항은 아래 담당자에게 연락 주시기 바랍니다.
        </Paragraph>
        <Paragraph>
          담당자: {developerName}
          <br />
          이메일: {contactEmail}
        </Paragraph>

        <SectionTitle>7. 개인 정보 처리 방침 변경</SectionTitle>
        <Paragraph>
          본 개인정보 처리방침은 법률 및 서비스 변경에 따라 내용이 수정될 수 있습니다. 변경 사항이 발생하는 경우, 본 페이지를 통해 공지할 예정입니다.
        </Paragraph>

        <SectionTitle>8. 문의사항</SectionTitle>
        <Paragraph>
          본 개인정보 처리방침에 대한 문의사항은 아래 연락처로 문의해 주시기 바랍니다.
          <br />
          이메일: {contactEmail}
        </Paragraph>

        <Footer>
          © {currentYear} {developerName}. All rights reserved.
        </Footer>
      </ContentContainer>
    </PageWrapper>
  );
}