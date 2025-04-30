// Make sure this line is at the top if using the css prop,
// or if your framework/bundler requires it for styled components.
/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled';
import type { Metadata } from 'next';

// --- Styled Components ---

// Basic color palette (approximating Tailwind)
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
  indigo50: '#eef2ff',
  indigo100: '#e0e7ff',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',
  indigo800: '#3730a3',
};

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${colors.gray50};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem; /* py-12 px-4 */

  @media (min-width: 640px) { /* sm */
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  @media (min-width: 1024px) { /* lg */
    padding-left: 2rem;
    padding-right: 2rem;
  }
`;

const ContentCard = styled.div`
  max-width: 56rem; /* max-w-4xl */
  width: 100%;
  background-color: ${colors.white};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-xl */
  border-radius: 0.5rem; /* rounded-lg */
  padding: 2rem; /* p-8 */

  @media (min-width: 768px) { /* md */
    padding: 3rem; /* md:p-12 */
  }

  /* space-y-8 equivalent */
  & > * + * {
    margin-top: 2rem;
  }
`;

const Header = styled.header`
  text-align: center;
  /* space-y-4 equivalent */
  & > * + * {
    margin-top: 1rem;
  }
`;

const LogoImage = styled.img`
  margin-left: auto;
  margin-right: auto;
  height: 4rem; /* h-16 */
  width: auto;
`;

const Heading1 = styled.h1`
  font-size: 1.875rem; /* text-3xl */
  line-height: 2.25rem;
  font-weight: 800; /* font-extrabold */
  color: ${colors.gray900};

  @media (min-width: 768px) { /* md */
    font-size: 2.25rem; /* md:text-4xl */
    line-height: 2.5rem;
  }
`;

const SubHeading = styled.p`
  margin-top: 0.5rem; /* mt-2 */
  font-size: 1.125rem; /* text-lg */
  line-height: 1.75rem;
  color: ${colors.indigo600};
  font-weight: 600; /* font-semibold */
`;

const DescriptionParagraph = styled.p`
  margin-top: 1rem; /* mt-4 */
  font-size: 1rem; /* text-md */
  line-height: 1.5rem;
  color: ${colors.gray600};
  max-width: 42rem; /* max-w-2xl */
  margin-left: auto;
  margin-right: auto;
`;

const Section = styled.section`
  margin-top: 2.5rem; /* mt-10 */
  padding-top: 2rem; /* pt-8 */
  border-top: 1px solid ${colors.gray200};
`;

const SectionHeading = styled.h2`
  font-size: 1.5rem; /* text-2xl */
  line-height: 2rem;
  font-weight: 700; /* font-bold */
  text-align: center;
  color: ${colors.gray800};
  margin-bottom: 1.5rem; /* mb-6 */
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr)); /* grid-cols-1 */
  gap: 1.5rem; /* gap-6 */

  @media (min-width: 768px) { /* md */
    grid-template-columns: repeat(2, minmax(0, 1fr)); /* md:grid-cols-2 */
  }
`;

const FeatureBox = styled.div`
  background-color: ${colors.indigo50};
  padding: 1rem; /* p-4 */
  border-radius: 0.5rem; /* rounded-lg */
`;

const FeatureHeading = styled.h3`
  font-weight: 600; /* font-semibold */
  color: ${colors.indigo800};
`;

const FeatureText = styled.p`
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  color: ${colors.indigo700};
  margin-top: 0.25rem; /* mt-1 */
`;

const LanguageTagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem; /* gap-2 */
`;

const LanguageTag = styled.span`
  background-color: ${colors.gray200};
  color: ${colors.gray700};
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  font-weight: 500; /* font-medium */
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  border-radius: 9999px; /* rounded-full */
`;

const OrderedList = styled.ol`
  list-style-type: decimal;
  list-style-position: inside;
  color: ${colors.gray700};
  text-align: center;

  @media (min-width: 768px) { /* md */
     text-align: left;
  }

  /* space-y-2 equivalent */
  & > li + li {
    margin-top: 0.5rem;
  }
`;

const CodeInline = styled.code`
  background-color: ${colors.gray100};
  padding: 0.25rem; /* p-1 */
  border-radius: 0.25rem; /* rounded */
  font-size: 0.875rem; /* text-sm */
  color: ${props => props.color || colors.gray700}; /* Allow overriding color */
`;

const Footer = styled.footer`
  margin-top: 2.5rem; /* mt-10 */
  padding-top: 2rem; /* pt-8 */
  border-top: 1px solid ${colors.gray200};
  text-align: center;
`;

// Placeholder for CTA button, can be styled further
// const CallToActionButton = styled.a`
//   display: inline-block;
//   background-color: ${colors.indigo600};
//   color: ${colors.white};
//   font-weight: 700; /* font-bold */
//   padding: 0.5rem 1rem; /* py-2 px-4 */
//   border-radius: 0.375rem; /* rounded */
//   text-decoration: none;
//   transition: background-color 0.2s ease-in-out;

//   &:hover {
//     background-color: ${colors.indigo700};
//   }
// `;

const FooterText = styled.p`
  margin-top: 1.5rem; /* mt-6 */
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem;
  color: ${colors.gray500};
`;


// --- Component ---

export const metadata: Metadata = {
  title: '슬라이드 번역기 | Google 슬라이드 자동 번역 부가기능',
  description: '클릭 몇 번으로 Google 슬라이드 프레젠테이션의 텍스트, 도형, 표, 마스터, 노트까지 원하는 언어로 번역하세요.',
};

export default function HomePage() {
  const supportedLanguages = [
    '한국어 (ko)', '영어 (en)', '인도네시아어 (id)', '인도(힌디어) (hi)',
    '태국어 (th)', '일본어 (ja)', '중국어(간체) (zh)', '베트남어 (vi)',
    '필리핀(타갈로그어) (tl)'
  ];

  const highlightCodeColor = colors.indigo700; // Color for specific code blocks

  return (
    <PageWrapper>
      <ContentCard>

        {/* Header Section */}
        <Header>
          <LogoImage
            src="https://ssl.gstatic.com/docs/script/images/logo/script-64.png"
            alt="슬라이드 번역기 로고"
          />
          <Heading1>
            슬라이드 번역기
          </Heading1>
          <SubHeading>
            Google 슬라이드, 클릭 몇 번으로 간편하게 번역하세요!
          </SubHeading>
          <DescriptionParagraph>
            프레젠테이션 내 텍스트, 도형, 표, 마스터 슬라이드, 레이아웃, 발표자 노트까지!
            복잡한 과정 없이 원하는 언어로 손쉽게 번역해주는 Google Workspace 부가기능입니다.
          </DescriptionParagraph>
        </Header>

        {/* Features Section */}
        <Section>
          <SectionHeading>
            주요 기능
          </SectionHeading>
          <Grid>
            <FeatureBox>
              <FeatureHeading>다국어 번역 지원</FeatureHeading>
              <FeatureText>
                다양한 언어 간 번역을 지원하여 글로벌 커뮤니케이션을 돕습니다. (아래 지원 언어 목록 참고)
              </FeatureText>
            </FeatureBox>
            <FeatureBox>
              <FeatureHeading>포괄적인 번역 범위</FeatureHeading>
              <FeatureText>
                단순 텍스트뿐만 아니라 도형 안의 글자, 표 내용, 마스터/레이아웃 요소, 발표자 노트까지 번역합니다.
              </FeatureText>
            </FeatureBox>
            <FeatureBox>
              <FeatureHeading>간편한 사용법</FeatureHeading>
              <FeatureText>
                Google 슬라이드 사이드바에서 직관적인 인터페이스를 통해 언어를 선택하고 바로 번역을 시작할 수 있습니다.
              </FeatureText>
            </FeatureBox>
            <FeatureBox>
              <FeatureHeading>안정적인 번역</FeatureHeading>
              <FeatureText>
                Google 번역 엔진을 사용하며, 일시적인 오류 발생 시 재시도 로직을 통해 안정성을 높였습니다.
              </FeatureText>
            </FeatureBox>
          </Grid>
        </Section>

        {/* Supported Languages Section */}
        <Section>
           <SectionHeading>
             지원 언어
           </SectionHeading>
           <LanguageTagContainer>
             {supportedLanguages.map((lang) => (
               <LanguageTag key={lang}>
                 {lang}
               </LanguageTag>
             ))}
           </LanguageTagContainer>
         </Section>

        {/* How to Use Section */}
        <Section>
          <SectionHeading>
            사용 방법
          </SectionHeading>
          <OrderedList>           
            <li>번역할 Google 슬라이드 문서를 엽니다.</li>
            <li>상단 메뉴에서 <CodeInline>부가기능</CodeInline> {'>'} <CodeInline>슬라이드 번역기</CodeInline> {'>'} <CodeInline>번역기 실행</CodeInline>을 선택합니다.</li>
            <li>오른쪽 사이드바에서 <CodeInline color={highlightCodeColor} css={{ backgroundColor: colors.indigo100 }}>번역 설정 및 시작</CodeInline> 버튼을 클릭합니다.</li>
            <li>팝업 창에서 원본 언어(자동 감지 권장 시 명시)와 번역할 언어를 선택하고 <CodeInline color={highlightCodeColor} css={{ backgroundColor: colors.indigo100 }}>번역 시작</CodeInline>을 누릅니다.</li>
            <li>잠시 기다리면 번역이 완료됩니다!</li>
          </OrderedList>
        </Section>

        {/* Footer */}
        <Footer>
           {/* Placeholder for marketplace link button */}
           {/* <CallToActionButton href="#">
             지금 바로 설치하기 (Marketplace 링크)
           </CallToActionButton> */}
           <FooterText>
             © {new Date().getFullYear()} 윤은석 (Eunseok Yun). All rights reserved.
           </FooterText>
         </Footer>

      </ContentCard>
    </PageWrapper>
  );
}