import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const body = req.body as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async (pathname) => {
        // 여기서 사용자 인증, 권한 확인 등을 수행할 수 있습니다
        // 이 예제에서는 단순화를 위해 모든 PDF 업로드를 허용합니다

        return {
          // PDF, DOCX, TXT 파일만 허용
          allowedContentTypes: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
          ],
          // 덮어쓰기 방지 (같은 이름의 파일이 있을 경우 랜덤 접미사 추가)
          addRandomSuffix: true,
          // 선택적으로 메타데이터를 토큰에 포함시킬 수 있습니다
          tokenPayload: JSON.stringify({
            timestamp: Date.now(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 업로드 완료 시 실행됩니다 (로컬 개발 시에는 동작하지 않음)
        // 예: 데이터베이스 업데이트, 로깅 등
        
        console.log('Blob 업로드 완료:', blob);
        
        try {
          // 여기서 추가적인 로직을 실행할 수 있습니다
          // 예: 업로드된 파일 URL을 데이터베이스에 저장
          // 참고: 파일 삭제는 번역 완료 후 TranslationProcess.tsx에서 처리됩니다
        } catch (error) {
          console.error('업로드 후처리 중 오류:', error);
        }
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error('업로드 URL 생성 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return res.status(500).json({ error: `업로드 처리 중 오류 발생: ${errorMessage}` });
  }
}
