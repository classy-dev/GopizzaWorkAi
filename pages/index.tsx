import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Global, css, keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { signIn, useSession } from 'next-auth/react';

// --- Keyframes ---
const twinkle = keyframes`
  from { opacity: 0.5; }
  to { opacity: 1; }
`;

const moveStars = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(-100vh); }
`;

const blink = keyframes`
  50% {
    border-right-color: #0f0;
  }
`;

const warpTravel = keyframes`
  from {
    transform: translateZ(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateZ(60rem) scale(3); /* Move towards viewer and grow */
    opacity: 0;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;


// --- Styled Components ---

const globalStyles = css`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body, #__next { /* Assuming Next.js root */
    height: 100%;
    overflow: hidden; /* Prevent scrollbars during warp */
    background-color: #0a041a; /* Deep space blue/purple */
    color: #0f0; /* Classic terminal green */
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 10px;
    line-height: 1.6;
  }
  body {
     position: relative; /* For star positioning */
  }
  #__next {
     display: flex;
     justify-content: center;
     align-items: center;
     height: 100%;
  }
  div, p, span, a {
    font-size:1.6rem;
  }
  .prompt-message { /* New style for prompts */
    color: #2cffdf;
    font-size: 1.8rem;
    margin-bottom: 1rem; /* Already has margin-bottom from p, but can adjust */
    display: block;
  }
`;

// Helper function to generate random box-shadow for stars
const createStarShadows = (count: number): string => {
  let value = '';
  for (let i = 0; i < count; i++) {
    value += `${Math.random() * 200}rem ${Math.random() * 200}rem #FFF${i === count - 1 ? '' : ','}`;
  }
  return value;
};

const StarsBase = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: .1rem;
  height: .1rem;
  background: transparent;
  animation: ${twinkle} 1.5s infinite alternate, ${moveStars} 100s linear infinite;
  box-shadow: ${createStarShadows(700)};
`;

const StarsMedium = styled(StarsBase)`
  width: .2rem;
  height: .2rem;
  animation: ${twinkle} 2s infinite alternate, ${moveStars} 75s linear infinite;
  box-shadow: ${createStarShadows(200)};
`;

const StarsLarge = styled(StarsBase)`
  width: .3rem;
  height: .3rem;
  animation: ${twinkle} 2.5s infinite alternate, ${moveStars} 50s linear infinite;
  box-shadow: ${createStarShadows(100)};
`;


const SignupContainer = styled.div<{ isHidden: boolean }>`
  background-color: rgba(0, 0, 0, 0.6); /* Semi-transparent black */
  border: .1rem solid #0f0;
  padding: 3rem;
  width: 90%;
  max-width: 65rem;
  min-height: 30rem;
  box-shadow: 0 0 1.5rem rgba(0, 255, 0, 0.3);
  position: relative; /* Ensure it's above stars */
  z-index: 10;
  opacity: ${props => (props.isHidden ? 0 : 1)};
  pointer-events: ${props => (props.isHidden ? 'none' : 'auto')};
  transition: opacity 0.5s ease-out;
  display: flex;
  flex-direction: column;
`;

const TerminalOutput = styled.div`
  height: 20rem; /* Adjust as needed */
  overflow-y: auto;
  margin-bottom: 1.5rem;
  word-wrap: break-word;
  flex-grow: 1;

  p {
    margin-bottom: .5rem;
    white-space: pre-wrap; /* Preserve whitespace and line breaks */
  }

  .prompt-line {
    color: #aaa; /* Grey for past prompts */
  }
  .prompt-symbol {
    color: #0ff; /* Cyan prompt symbol */
    margin-right: .8rem;
  }
  .user-input {
    color: #fff; /* White for user's entered text */
  }
  .system-message {
    color: #0f0; /* Green for system messages */
  }
  .error-message {
    color: #f00; /* Red for errors */
    font-weight: bold;
  }
  .success-message {
    color: #0f0; /* Green for success */
    font-weight: bold;
  }
`;

// Form related styled components
const FormSection = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  opacity: 1;
  transition: opacity 0.3s ease;
`;

const InputLabel = styled.label`
  color: #2cffdf;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  display: block;
`;

const FormInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: .1rem solid #0f0;
  color: #ffffff; /* White text for input */
  font-family: inherit;
  font-size: 1.6rem;
  padding: .8rem .5rem;
  margin-bottom: 1.5rem;
  width: 100%;
  outline: none;
  caret-color: #0f0;
  /* Blinking cursor imitation */
  border-right: .2rem solid transparent; /* Start transparent */


  &:focus {
    border-bottom: .2rem solid #ff66c4;
  }

  &:disabled {
    opacity: 0.7;
  }
`;

// Legacy styled components no longer needed
// Removing to clean up the code base

const WarpOverlay = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 100;
  overflow: hidden;
  display: ${props => props.isVisible ? 'block' : 'none'};
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: opacity 0.3s ease-in; /* Fade in */
  perspective: 40rem; /* For 3D effect, important for the warp animation */
`;

// 개별 WarpStar 컴포넌트를 위한 타입 정의
interface WarpStarProps {
  duration: number;
  delay: number;
  positionLeft: string;
  positionTop: string;
}

// 각 별을 위한 스타일드 컴포넌트 - 애니메이션을 직접 포함
const WarpStar = styled.div<WarpStarProps>`
  position: absolute;
  width: .2rem; /* Matching original size from login.html */
  height: .2rem;
  background-color: white;
  border-radius: 50%;
  left: ${props => props.positionLeft};
  top: ${props => props.positionTop};
  animation: ${warpTravel} ${props => props.duration}s ${props => props.delay}s ease-in forwards;
`;

const SuccessScreen = styled.div<{ isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff; /* Fade to white */
  z-index: 101; /* Above warp */
  display: ${props => props.isVisible ? 'flex' : 'none'};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #333;
  opacity: ${props => props.isVisible ? 1 : 0};
  animation: ${props => props.isVisible ? css`${fadeIn} 0.8s ease-out forwards` : 'none'};

  img {
    width: 15rem; /* Adjust size as needed */
    height: auto;
    margin-bottom: 2rem;
  }
  p {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
`;

const NewAccount = styled.div`


    margin-top: 1.5rem;
    color: gray;
    z-index: 10;

    width: 100%;
    max-width: 65rem;

`;


// --- Interfaces ---
interface OutputLine {
  id: number;
  text: string;
  type: 'system-message' | 'error-message' | 'success-message' | 'prompt-line' | 'prompt-message';
  promptSymbol?: string;
  userInput?: string;
}

type LoginStep = 'welcome' | 'awaiting_id' | 'awaiting_password' | 'processing' | 'warp' | 'success';

// --- Utility Hook for Typing Effect ---
const useTypingEffect = (message: string, speed = 50): string => {
  const [typedMessage, setTypedMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    setTypedMessage(''); // Reset when message changes
    let index = 0;
    const intervalId = setInterval(() => {
      setTypedMessage((prev) => prev + message[index]);
      index++;
      if (index === message.length) {
        clearInterval(intervalId);
      }
    }, speed);

    return () => clearInterval(intervalId); // Cleanup on unmount or message change
  }, [message, speed]);

  return typedMessage;
};


// --- Login Component ---
const LoginView = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const outputEndRef = useRef<HTMLDivElement | null>(null);
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showIdInput, setShowIdInput] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showWarp, setShowWarp] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoginStep>('welcome');
  const [isAuthenticating, setIsAuthenticating] = useState(false); // 로그인 처리 중 플래그

  const userData = useRef<{ id?: string }>({}); // Store ID, avoid password
  const nextLineId = useRef(0);
  const initialized = useRef(false); // Flag to prevent double execution

  // 이미 로그인된 사용자는 번역 페이지로 리다이렉트 (로그인 처리 중이 아닌 경우에만)
  useEffect(() => {
    // 로그인 완료 후 애니메이션이 진행 중이거나 인증 처리 중이면 리디렉션하지 않음
    if (session && !isAuthenticating && !showWarp && !showSuccess) {
      router.push('/ai-translate');
    }
  }, [session, router, isAuthenticating, showWarp, showSuccess]);
  


  // --- Helper Functions ---
  const addLine = useCallback((text: string, type: OutputLine['type'], options?: { promptSymbol?: string; userInput?: string }) => {
      setOutputLines(prev => [
          ...prev,
          { id: nextLineId.current++, text, type, ...options }
      ]);
  }, []);

  const typeAndAddLine = useCallback(async (text: string, type: OutputLine['type'], delay = 25) => {
      const lineId = nextLineId.current++;
      setOutputLines(prev => [...prev, { id: lineId, text: '', type }]);

      for (let i = 0; i < text.length; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          setOutputLines(prev => prev.map(line =>
              line.id === lineId ? { ...line, text: line.text + text[i] } : line
          ));
      }
  }, []);

  // Scroll to bottom of output
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputLines]);

  // We no longer need this effect for the new design

  // --- Login Flow Logic ---
  const showLoginForm = useCallback(() => {
    // Show the ID input form
    setShowIdInput(true);
    setCurrentStep('awaiting_id');
    // Focus the ID input when it appears
    setTimeout(() => {
      const idInput = document.getElementById('login-id-input');
      if (idInput) idInput.focus();
    }, 100); // Short delay to ensure element is in DOM
  }, []);
  
  const proceedToPasswordInput = useCallback(() => {
    // Show the password input form after ID is entered
    setShowPasswordInput(true);
    setCurrentStep('awaiting_password');
    // Focus the password input when it appears
    setTimeout(() => {
      const passwordInput = document.getElementById('login-password-input');
      if (passwordInput) passwordInput.focus();
    }, 100); // Short delay to ensure element is in DOM
  }, []);

  const triggerWarp = useCallback(() => {
      // Hide login container and show warp overlay
      setCurrentStep('warp');
      setShowWarp(true);

      // 워프 애니메이션 시간
      setTimeout(() => {
          // 워프 화면을 계속 표시한 채로 리디렉션 - 워프가 끝나기 전에 리디렉션
          setIsAuthenticating(false);
          router.push('/ai-translate');
          // 리디렉션이 완료될 때까지 워프 화면을 계속 표시 (로그인 폼이 잠깐 보이는 문제 해결)
      }, 2000); // 워프 애니메이션 시간 2초
  }, [router]);

  // --- Initial Welcome Message ---
  useEffect(() => {
    // Check if already initialized
    if (initialized.current) {
      return;
    }
    initialized.current = true; // Mark as initialized

    const startAdventure = async () => {
      // Only show typing animation for welcome messages
      await typeAndAddLine("Welcome to GOPIZZA WorkUp AI Login!", 'system-message');
      await typeAndAddLine("Let's begin the adventure...", 'system-message');
      setTimeout(showLoginForm, 500); // Show login form after intro
    };
    startAdventure();
  }, [showLoginForm, typeAndAddLine]);


  // --- Form Input Handling ---
  const handleIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoginId(event.target.value);
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleIdSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (loginId.trim()) {
      // Store the ID and proceed to password
      userData.current.id = loginId.trim();
      proceedToPasswordInput();
    } else {
      // Show error for empty ID
      addLine("Error: Login ID cannot be empty. Please try again.", 'error-message');
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!password.trim()) {
      // Show error for empty password
      addLine("Error: Password cannot be empty.", 'error-message');
      return;
    }
    
    // Set loading state and authenticate flag
    setIsLoading(true);
    setIsAuthenticating(true); // 인증 처리 중 플래그 활성화
    addLine('Verifying credentials...', 'system-message');
    
    try {
      // Call NextAuth signIn function
      const result = await signIn('credentials', {
        userId: loginId,
        password: password,
        redirect: false
      });
      
      if (result?.error) {
        // Login failed
        addLine("아이디 또는 비밀번호가 일치하지 않습니다.", 'error-message');
        setIsLoading(false);
        return;
      }
      
      // Login successful
      addLine('Credentials verified. Engaging warp drive...', 'success-message');
      // Proceed to warp animation
      setCurrentStep('processing');
      setTimeout(triggerWarp, 500);
    } catch (err) {
      console.error('Login error:', err);
      addLine("System error during authentication.", 'error-message');
      setIsLoading(false);
    }
  };
  
  // Handle enter key in ID input to submit
  const handleIdKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleIdSubmit(event);
    }
  };
  
  // Handle enter key in password input to submit
  const handlePasswordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handlePasswordSubmit(event);
    }
  };

  return (
    <>
      <Global styles={globalStyles} />
      <StarsBase />
      <StarsMedium />
      <StarsLarge />
      
      {/* 세션 로딩 중일 때 처리 */}
      {status === 'loading' ? (
        <SignupContainer isHidden={false}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ color: '#0f0', fontSize: '1.8rem', marginBottom: '2rem' }}>시스템 초기화 중...</div>
            <div style={{ width: '10rem', height: '10rem', border: '.2rem solid #0f0', borderRadius: '50%', borderTopColor: 'transparent', animation: `${blink} 1s infinite linear` }}></div>
          </div>
        </SignupContainer>
      ) : (
        <>
          {/* 로그인 박스와 회원가입 링크를 감싸는 수직 컨테이너 */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}>
            <SignupContainer isHidden={showWarp || showSuccess}>
              {/* Terminal Output Area - Shows welcome messages and status updates */}
              <TerminalOutput>
                {outputLines.map((line) => (
                  <p key={line.id} className={line.type}>
                    {line.type === 'prompt-line' ? (
                      <>
                        <span className="prompt-symbol">{line.promptSymbol}</span>
                        <span className="user-input">{line.userInput}</span>
                      </>
                    ) : (
                      line.text
                    )}
                  </p>
                ))}
                <div ref={outputEndRef} /> {/* Element to scroll to */}
              </TerminalOutput>

              {/* ID Input Form - Shows after welcome messages */}
              {showIdInput && (
                <FormSection>
                  <InputLabel htmlFor="login-id-input">Enter your Login ID:</InputLabel>
                  <FormInput
                    id="login-id-input"
                    type="text"
                    value={loginId}
                    onChange={handleIdChange}
                    onKeyDown={handleIdKeyDown}
                    autoComplete="off"
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                  />
                </FormSection>
              )}

              {/* Password Input Form - Shows after ID is entered */}
              {showPasswordInput && (
                <FormSection>
                  <InputLabel htmlFor="login-password-input">Enter your Password:</InputLabel>
                  <FormInput
                    id="login-password-input"
                    type="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyDown={handlePasswordKeyDown}
                    autoComplete="off"
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.7 : 1 }}
                  />
                  {isLoading && (
                    <div style={{ color: '#0f0', textAlign: 'center', marginTop: '1rem' }}>
                      Authenticating... <span style={{ animation: `${blink} 1s infinite` }}>▋</span>
                    </div>
                  )}
                </FormSection>
              )}
            </SignupContainer>

            {/* 회원가입 링크 - 박스 바로 아래에 배치 */}
            <NewAccount>
              New to GOPIZZA WorkUp AI? {" "}
              <Link href="/auth/signup">
                <span style={{
             
                  cursor: 'pointer',
                  textDecoration: 'underline',
                
                }}>Create an account</span>
              </Link>
            </NewAccount>
          </div>

          {/* --- Warp Speed Overlay --- */}
          <WarpOverlay isVisible={showWarp}>
            {/* Generate 300 stars dynamically for warp, matching login.html */}
            {showWarp && Array.from({ length: 300 }).map((_, i) => {
              // Randomize animation duration and delay for variation, exactly like login.html
              const duration = 1 + Math.random() * 1.5; // 1s to 2.5s
              const delay = Math.random() * 0.5; // 0s to 0.5s delay
              
              // Position stars randomly, biased towards the center initially
              const angle = Math.random() * Math.PI * 2;
              const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
              const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
              const radius = Math.random() * Math.min(windowWidth, windowHeight) * 0.4; // Start closer to center
              
              const startLeft = windowWidth / 2 + Math.cos(angle) * radius;
              const startTop = windowHeight / 2 + Math.sin(angle) * radius;

              return (
                <WarpStar
                  key={i}
                  duration={duration}
                  delay={delay}
                  positionLeft={`${startLeft}px`}
                  positionTop={`${startTop}px`}
                />
              );
            })}
          </WarpOverlay>


          
        </>
        
      )}
    </>
  );
};

export default LoginView;
