import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { toast } from 'react-toastify';
import { Cancel as CancelIcon } from '@mui/icons-material';
import {
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import { useStores } from '@/hooks/useStores';
import { TranslatedChunk } from '@/stores/translate/TranslationStore';

/**
 * 문서 번역 진행 및 결과 표시 컴포넌트
 */
const TranslationProcess: React.FC = observer(() => {
  const { translationStore, documentStore, uiStore } = useStores();
  const [, setTranslationComplete] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState<Date | null>(null);
  const [translationStarted, setTranslationStarted] = useState(false);

  // 번역 방향 및 외국어 선택 상태 관리
  const [translationDirection, setTranslationDirection] = useState('foreign-to-korean');
  const [targetLanguage, setTargetLanguage] = useState('영어');

  // 번역 방향 변경 핸들러
  const handleDirectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTranslationDirection(event.target.value);
    // 라디오 버튼 값에 따라 번역 방향 변경
  };

  // 사용 가능한 대상 언어 목록
  const availableTargetLanguages = [
    { value: '영어', label: '영어' },
    { value: '인도네시아', label: '인도네시아' },
    { value: '인도', label: '힌디어' },
    { value: '태국', label: '태국어' },
    { value: '일본어', label: '일본어' },
    { value: '중국어(간체)', label: '중국어 간체' },
    { value: '중국어(번체)', label: '중국어 번체' },
    { value: '베트남', label: '베트남' },
    { value: '필리핀', label: '필리핀' },
  ];

  // 인터벌 참조를 위한 ref 생성
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // 번역 진행 중인지 확인하는 플래그
  const isProcessingRef = useRef<boolean>(false);

  // 번역 진행 상태 모니터링
  useEffect(() => {
    // 번역 완료 상태 확인
    if (
      translationStarted &&
      translationStore.translatedChunks.length > 0 &&
      (translationStore.translationProgress === 100 || 
       translationStore.currentTranslationIndex >= documentStore.chunks.length - 1)
    ) {
      setTranslationComplete(true);
      toast.success('번역이 완료되었습니다!');
      
      // 사용 정보 기록
      logUsage();
      
      // Blob 파일 삭제 (번역 완료 시)
      if (documentStore.blobUrl) {
        try {
          console.log('Blob 파일 삭제 요청 전송:', documentStore.blobUrl);
          
          // 비동기 요청으로 파일 삭제 - 삭제 실패해도 진행에 영향 없음
          fetch('/api/translate/upload/delete-blob', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              blobUrl: documentStore.blobUrl,
            }),
          })
          .then(response => {
            if (response.ok) {
              console.log('Blob 파일 삭제 성공');
            } else {
              console.error('Blob 파일 삭제 실패:', response.status);
            }
          })
          .catch(error => {
            console.error('Blob 파일 삭제 요청 중 오류:', error);
          });
          
        } catch (error) {
          console.error('Blob 파일 삭제 중 오류:', error);
          // 파일 삭제 실패해도 진행은 계속됨
        }
      }
      
      // 번역 완료 후 2초 후에 자동으로 다음 단계로 이동
      const timer = setTimeout(() => {
        uiStore.nextStep();
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    // 에러 발생 시간 기록
    if (
      translationStore.lastError &&
      (!errorOccurred || translationStore.lastError > errorOccurred)
    ) {
      setErrorOccurred(translationStore.lastError);
    }
  }, [
    translationStarted,
    translationStore.translatedChunks.length,
    documentStore.chunks.length,
    translationStore.lastError,
    translationStore.translationProgress,
    translationStore.currentTranslationIndex,
    errorOccurred,
    uiStore,
  ]);

  // 번역 시작
  const startTranslation = () => {
    try {
      // 이미 진행 중인 경우 중복 시작 방지
      if (isProcessingRef.current) {
        return;
      }
      setTranslationStarted(true);
      isProcessingRef.current = true;

      // [디버깅] 번역 시작 로그
      console.log('🔍 [DEBUG] 번역 프로세스 시작');
      console.log('🔍 [DEBUG] 문서 청크 개수:', documentStore.chunks.length);
      console.log('🔍 [DEBUG] 첫 번째 청크 정보:', 
        documentStore.chunks.length > 0 ? {
          id: documentStore.chunks[0].id,
          text: documentStore.chunks[0].text.substring(0, 50) + '...',
          length: documentStore.chunks[0].text.length,
          structureType: documentStore.chunks[0].structureType
        } : '없음');

      // 번역 방향 및 대상 언어 설정
      translationStore.isKoreanSource = translationDirection === 'korean-to-foreign';
      
      if (translationDirection === 'korean-to-foreign') {
        // 한글 -> 외국어 번역의 경우
        translationStore.sourceLang = '한국어';
        translationStore.targetLang = targetLanguage;
      } else if (translationDirection === 'select-to-target') {
        // 자동감지 -> 번역어 번역의 경우
        translationStore.sourceLang = '자동감지';
        translationStore.targetLang = targetLanguage;
      } else {
        // 외국어 -> 한글 번역의 경우(기존 로직)
        translationStore.sourceLang = '영어'; // 기본값, 추후 자동 감지 또는 수동 선택으로 변경 가능
        translationStore.targetLang = '한국어';
      }

      // API 호출 간격 조정
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 번역 상태 초기화 및 설정
      translationStore.isTranslating = true;
      translationStore.currentTranslationIndex = 0;
      translationStore.translationProgress = 0;

      console.log('[번역 시작] 번역을 시작합니다.');

      // [디버깅] translateNextChunk 호출 직전
      console.log('🔍 [DEBUG] translateNextChunk 호출 직전');
      console.log('🔍 [DEBUG] translateNextChunk 호출 이전에 다른 번역 요청이 있는지 확인');

      // 첫 번째 청크 번역 직접 시작
      try {
        isProcessingRef.current = true;
        
        // 문서에 텍스트가 있는지 확인
        if (documentStore.chunks.length === 0) {
          toast.error('번역할 텍스트가 없습니다. 문서를 다시 업로드해주세요.');
          isProcessingRef.current = false;
          return;
        }

        console.log('[번역 시작] 첫 번째 청크 번역 시작');
        
        // 첫 번째 청크 번역 시작
        translationStore.translateNextChunk()
          .then(hasMoreChunks => {
            console.log(
              '[번역 시작] 첫 번째 청크 번역 완료, 더 번역할 청크: ',
              hasMoreChunks
            );
            isProcessingRef.current = false;

            if (!hasMoreChunks) {
              console.log('[번역 완료] 더 이상 번역할 청크가 없습니다.');
              setTranslationComplete(true);
              toast.success('모든 텍스트가 번역되었습니다!');
              return;
            }

            // 정기적으로 다음 청크 번역 (번역할 청크가 남아있는 경우만)
            console.log('[인터벌 설정] 다음 번역을 위한 5초 간격 인터벌 설정');
            intervalRef.current = setInterval(async () => {
              // 이미 처리 중이면 스킵
              if (isProcessingRef.current) {
                return;
              }

              try {
                // 번역 중지됐으면 인터벌 취소
                if (!translationStore.isTranslating) {
                  console.log('[인터벌] 번역이 중지되어 인터벌 취소');
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  return;
                }

                console.log('[인터벌] 다음 청크 번역 시작');
                isProcessingRef.current = true;

                // 다음 청크 번역 처리
                const hasMore = await translationStore.translateNextChunk();
                console.log(
                  '[인터벌] 청크 번역 완료, 더 번역할 청크 있음: ',
                  hasMore
                );

                // 모든 청크 번역 완료 시 인터벌 정리
                if (!hasMore) {
                  console.log('[인터벌] 모든 청크 번역 완료, 인터벌 정리');
                  if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                  }
                  setTranslationComplete(true);
                  toast.success('모든 텍스트가 번역되었습니다!');
                }
              } catch (error) {
                console.error('[인터벌] 번역 중 오류:', error);
                toast.error('번역 중 오류가 발생했습니다.');
              } finally {
                isProcessingRef.current = false;
              }
            }, 5000);
          });
      } catch (error) {
        console.error('[번역 시작] 첫 번째 청크 번역 중 오류:', error);
        toast.error('첫 번째 청크 번역 중 오류가 발생했습니다.');
        isProcessingRef.current = false;
      }
    } catch (error) {
      console.error('번역 시작 중 오류:', error);
      toast.error('번역 시작 중 오류가 발생했습니다.');
      isProcessingRef.current = false;
    }
  };

  // 번역 취소
  const cancelTranslation = () => {
    console.log('[번역 취소] 번역 취소 요청');

    // 인터벌 정리
    if (intervalRef.current) {
      console.log('[번역 취소] 인터벌 정리');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // 번역 상태 업데이트
    translationStore.cancelTranslation(); // 스토어의 취소 메소드 호출
    isProcessingRef.current = false;

    toast.info('번역이 취소되었습니다.');
    
    // 첫 화면으로 돌아가기
    uiStore.setActiveStep(0); // 첫 번째 화면으로 이동 (파일 업로드 화면)
  };

  // 이전 단계로 이동
  const handleBack = () => {
    uiStore.prevStep();
  };

  // 진행률 계산 - translationStore의 값을 직접 사용
  const progressPercent = translationStore.translationProgress;

  // 사용 정보 기록
  const logUsage = async () => {
    try {
      // 문서 이름과 길이 정보 준비
      const documentName = documentStore.documentName || '이름 없음';
      // 모든 텍스트 청크의 길이 합산
      const documentLength = documentStore.chunks.reduce(
        (total, chunk) => total + chunk.text.length,
        0
      );

      // 사용 정보 기록 API 호출
      const response = await fetch('/api/usage/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menuName: '번역',
          documentName,
          documentLength,
        }),
      });

      if (!response.ok) {
        console.error('사용 정보 기록 실패:', await response.text());
      }
    } catch (error) {
      console.error('사용 정보 기록 중 오류:', error);
      // 사용 정보 기록 실패는 중요하지 않으므로 사용자에게 표시하지 않음
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: '800px', mx: 'auto', mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        문서 번역 진행
      </Typography>

      {!translationStarted ? (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" sx={{ mb: 3 }}>
            번역 시작 버튼을 클릭하여 문서 번역을 시작하세요.
          </Typography>
          
          {/* 번역 방향 옵션 */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RadioGroup
              value={translationDirection}
              onChange={handleDirectionChange}
              sx={{ mb: 2 }}
            >
              <FormControlLabel
                value="foreign-to-korean"
                control={<Radio />}
                label="자동감지 -> 한글"
              />
              <FormControlLabel
                value="select-to-target"
                control={<Radio />}
                label="자동감지 -> 번역어"
              />
            </RadioGroup>
            
            {/* 한글 -> 외국어 옵션이 선택된 경우에만 외국어 드롭다운 표시 */}
            {translationDirection === 'select-to-target' && (
              <FormControl sx={{ minWidth: 200, mb: 2 }}>
                <InputLabel id="target-language-label">대상 언어 선택</InputLabel>
                <Select
                  labelId="target-language-label"
                  value={targetLanguage}
                  label="대상 언어 선택"
                  onChange={(e: SelectChangeEvent) => setTargetLanguage(e.target.value)}
                >
                  {availableTargetLanguages.map((lang) => (
                    <MenuItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={startTranslation}
              disabled={translationStarted}
            >
              번역 진행 시작
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2">
                진행률: {progressPercent}% (
                {translationStore.progressCounter}/
                {translationStore.totalChunks} 청크)
              </Typography>
              {errorOccurred && (
                <Typography variant="body2" color="error">
                  마지막 오류: {errorOccurred.toLocaleTimeString()}
                </Typography>
              )}
            </Box>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={cancelTranslation}
              sx={{ mx: 1 }}
            >
              번역 취소
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Chip label="번역 결과" />
          </Divider>

          {translationStore.translatedChunks.length > 0 ? (
            translationStore.translatedChunks
              .slice(-3)
              .map((chunk: TranslatedChunk) => (
                <Card
                  key={chunk.id}
                  sx={{ mb: 2, bgcolor: 'background.paper' }}
                >
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      color="textSecondary"
                      gutterBottom
                    >
                      청크 ID: {chunk.id} (페이지: {chunk.pages.join(', ')})
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ maxHeight: '100px', overflow: 'hidden' }}
                    >
                      {chunk.translatedText.length > 200
                        ? chunk.translatedText.substring(0, 200) + '...'
                        : chunk.translatedText}
                    </Typography>
                  </CardContent>
                </Card>
              ))
          ) : (
            <Typography variant="body1" color="textSecondary">
              아직 번역된 청크가 없습니다.
            </Typography>
          )}
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={handleBack}>
          이전 단계
        </Button>
      </Box>
    </Paper>
  );
});

export default TranslationProcess;
