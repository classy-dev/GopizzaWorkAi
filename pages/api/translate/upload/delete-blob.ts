import { del } from '@vercel/blob';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메소드입니다.' });
  }

  try {
    const { blobUrl } = req.body;

    if (!blobUrl) {
      return res.status(400).json({ error: 'Blob URL이 제공되지 않았습니다.' });
    }

    // Vercel Blob 파일 삭제
    await del(blobUrl);

    return res.status(200).json({
      success: true,
      message: 'Blob이 성공적으로 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Blob 삭제 오류:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return res.status(500).json({ error: `Blob 삭제 중 오류 발생: ${errorMessage}` });
  }
}
