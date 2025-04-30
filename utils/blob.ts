import { put, del, list, PutBlobResult } from '@vercel/blob';

/**
 * 문서 파일을 Vercel Blob Store에 업로드
 * @param file File 객체
 * @param filename 파일 이름
 * @returns Blob 저장 결과
 */
export async function uploadFileToBlob(
  fileBuffer: Buffer, 
  filename: string, 
  contentType: string
): Promise<PutBlobResult> {
  try {
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      contentType,
    });
    
    console.log(`[Blob 스토리지] 파일 업로드 성공: ${blob.url}`);
    return blob;
  } catch (error) {
    console.error('[Blob 스토리지] 파일 업로드 실패:', error);
    throw error;
  }
}

/**
 * Blob Store에서 파일 삭제
 * @param url 삭제할 파일의 URL
 */
export async function deleteFileFromBlob(url: string): Promise<void> {
  try {
    await del(url);
    console.log(`[Blob 스토리지] 파일 삭제 성공: ${url}`);
  } catch (error) {
    console.error('[Blob 스토리지] 파일 삭제 실패:', error);
    throw error;
  }
}

/**
 * Blob Store의 모든 파일 목록 조회
 */
export async function listBlobFiles(prefix?: string) {
  try {
    const { blobs } = await list({ prefix });
    return blobs;
  } catch (error) {
    console.error('[Blob 스토리지] 파일 목록 조회 실패:', error);
    throw error;
  }
}
