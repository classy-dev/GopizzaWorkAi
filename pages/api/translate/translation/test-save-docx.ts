import { promises as fsPromises } from 'fs';
import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { NextApiRequest, NextApiResponse } from 'next';

// 결과 파일을 저장할 디렉토리
const RESULTS_DIR = path.join(process.cwd(), 'public', 'results');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 파라미터 가져오기
    const { action = 'generate', text = 'My name is Eunsuk' } = req.query;
    const fileId = new Date().getTime().toString();
    const fileName = `translated_mirror_${fileId}.docx`;
    const filePath = path.join(RESULTS_DIR, fileName);

    // 결과 디렉토리 생성 (없는 경우)
    await fsPromises.mkdir(RESULTS_DIR, { recursive: true });

    // download 액션: 이미 생성된 파일 다운로드
    if (action === 'download' && req.query.fileId) {
      const downloadFilePath = path.join(
        RESULTS_DIR,
        `translated_mirror_${req.query.fileId}.docx`
      );

      try {
        // 파일 존재 확인
        await fsPromises.access(downloadFilePath);

        // 파일 통계 정보 가져오기
        const stats = await fsPromises.stat(downloadFilePath);
        const encodedFilename = encodeURIComponent(
          `translated_mirror_${req.query.fileId}.docx`
        );

        // 헤더 설정
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Length', stats.size);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="translated_mirror_${req.query.fileId}.docx"; filename*=UTF-8''${encodedFilename}`
        );
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        // 파일 스트림 생성 및 응답
        const fileStream = fs.createReadStream(downloadFilePath);
        fileStream.pipe(res);
        return;
      } catch (error) {
        return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }
    }

    // 생성 액션: 테스트 문서 생성
    console.log('테스트 번역 문서 생성 중...');
    console.time('문서 생성 시간');

    // 문단 준비
    const paragraphs = [];

    // 제목 추가
    paragraphs.push(
      new Paragraph({
        text: '번역 테스트 문서 (미러)',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );

    // 원본 텍스트
    paragraphs.push(
      new Paragraph({
        text: '원본:',
        heading: HeadingLevel.HEADING_2,
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: String(text),
            size: 24,
          }),
        ],
        spacing: {
          before: 120,
          after: 120,
        },
      })
    );

    // 번역 텍스트
    paragraphs.push(
      new Paragraph({
        text: '번역:',
        heading: HeadingLevel.HEADING_2,
      })
    );

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `제 이름은 은석입니다`,
            size: 24,
          }),
        ],
        spacing: {
          before: 120,
          after: 120,
        },
      })
    );

    // 문서 생성 - 테스트 코드와 동일한 구조 사용
    const doc = new Document({
      title: '번역 테스트 문서',
      description: '번역 테스트 문서입니다',
      creator: 'PDF Global Translate Web - 테스트',
      sections: [
        {
          children: paragraphs,
        },
      ],
    });

    console.log('문서 생성 완료, 저장 시작...');

    // Base64 방식으로 저장 (테스트 코드에서 성공한 방식)
    const base64String = await Packer.toBase64String(doc);
    const buffer = Buffer.from(base64String, 'base64');
    await fsPromises.writeFile(filePath, buffer);

    console.timeEnd('문서 생성 시간');

    // 파일 크기 확인
    const stats = await fsPromises.stat(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`문서 생성 및 저장 완료: ${filePath} (${fileSizeMB} MB)`);

    // 다운로드 URL 생성
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || '';
    const baseUrl = `${protocol}://${host}`;

    // 생성 완료 응답 (다운로드 URL 제공)
    res.status(200).json({
      success: true,
      message: `테스트 번역 문서가 생성되었습니다 (${fileSizeMB} MB).`,
      fileName,
      fileId,
      fileSizeMB,
      downloadUrl: `/api/translate/translation/test-save-docx?action=download&fileId=${fileId}`,
    });
  } catch (error) {
    console.error('테스트 DOCX 생성 중 오류:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
