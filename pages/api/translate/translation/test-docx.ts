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
  Table,
  TableRow,
  TableCell,
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
    const { method = 'base64', action = 'generate', pages = '100' } = req.query;
    const pageCount = parseInt(String(pages), 10) || 100; // 기본값 100페이지
    const fileId = new Date().getTime().toString();
    const fileName = `test_large_${fileId}.docx`;
    const filePath = path.join(RESULTS_DIR, fileName);

    // 결과 디렉토리 생성 (없는 경우)
    await fsPromises.mkdir(RESULTS_DIR, { recursive: true });

    // download 액션: 이미 생성된 파일 다운로드
    if (action === 'download' && req.query.fileId) {
      const downloadFilePath = path.join(
        RESULTS_DIR,
        `test_large_${req.query.fileId}.docx`
      );

      try {
        // 파일 존재 확인
        await fsPromises.access(downloadFilePath);

        // 파일 통계 정보 가져오기
        const stats = await fsPromises.stat(downloadFilePath);
        const encodedFilename = encodeURIComponent(
          `test_large_${req.query.fileId}.docx`
        );

        // 헤더 설정
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        res.setHeader('Content-Length', stats.size);
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="test_large_${req.query.fileId}.docx"; filename*=UTF-8''${encodedFilename}`
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

    // 생성 액션: 대용량 테스트 문서 생성 (100 페이지)
    console.log(`대용량 테스트 문서 생성 중 (${pageCount} 페이지)...`);
    console.time('문서 생성 시간');

    // 초기 문단 준비
    const initialParagraphs = [
      new Paragraph({
        text: `대용량 테스트 문서 (${pageCount} 페이지)`,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `${method} 방식으로 생성된 문서`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: '이 문서는 PDF 번역 애플리케이션의 DOCX 변환 기능을 테스트하기 위해 생성되었습니다.',
      }),
      new Paragraph({ text: '생성 시간: ' + new Date().toLocaleString() }),
      new Paragraph({ text: '' }),
    ];

    // 추가 문단 및 표 준비
    const additionalContent = [];

    // 100 페이지 분량의 콘텐츠 생성
    for (let i = 1; i <= pageCount; i++) {
      // 페이지 제목
      additionalContent.push(
        new Paragraph({
          text: `페이지 ${i}`,
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          thematicBreak: true, // 페이지 구분선 추가
          spacing: { before: 400, after: 200 },
        })
      );

      // 페이지 내용 (여러 문단)
      for (let p = 1; p <= 5; p++) {
        additionalContent.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `이것은 페이지 ${i}의 ${p}번째 문단입니다. `,
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: '이 문서는 PDF 번역 애플리케이션의 대용량 문서 처리 기능을 테스트하기 위해 자동으로 생성되었습니다. ',
                size: 24,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: '한국어 번역 결과가 포함된 대용량 DOCX 파일이 Microsoft Word와 호환되는지 확인하기 위한 목적입니다.',
                size: 24,
                font: 'Times New Roman',
                italics: p % 2 === 0, // 짝수 문단은 이탤릭체
                bold: p % 3 === 0, // 3의 배수 문단은 볼드체
              }),
            ],
            spacing: { before: 120, after: 120 },
          })
        );
      }

      // 표 추가 (일부 페이지에만)
      if (i % 10 === 0) {
        additionalContent.push(
          new Paragraph({
            text: '테이블 예시:',
            spacing: { before: 200, after: 200 },
          })
        );

        // 표 생성
        const table = new Table({
          width: {
            size: 100,
            type: 'pct',
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: '열 1',
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: '열 2',
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: '값 1',
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text: '값 2',
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                }),
              ],
            }),
          ],
        });

        additionalContent.push(table);
      }
    }

    // 모든 페이지의 콘텐츠를 하나의 section에 통합
    const doc = new Document({
      title: '대용량 테스트 문서',
      description: `${pageCount}페이지 테스트 문서입니다 (${method} 방식)`,
      creator: 'PDF Global Translate Web - 대용량 테스트',
      sections: [
        {
          children: [...initialParagraphs, ...additionalContent],
        },
      ],
    });

    console.log(`${pageCount} 페이지 문서 생성 완료, 저장 시작...`);

    // 방법별 생성 로직 적용
    if (method === 'base64') {
      // 1. Base64 방식 (GitHub 이슈에서 제안된 방법)
      console.log('Base64 방식으로 DOCX 생성 중...');
      const base64String = await Packer.toBase64String(doc);
      const buffer = Buffer.from(base64String, 'base64');
      await fsPromises.writeFile(filePath, buffer);
    } else if (method === 'buffer') {
      // 2. 기존 방식
      console.log('기존 Buffer 방식으로 DOCX 생성 중...');
      const buffer = await Packer.toBuffer(doc);
      await fsPromises.writeFile(filePath, buffer);
    } else {
      return res.status(400).json({ error: '지원하지 않는 메소드입니다.' });
    }

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
      message: `${pageCount}페이지 문서가 ${method} 방식으로 생성되었습니다 (${fileSizeMB} MB).`,
      fileName,
      fileId,
      fileSizeMB,
      downloadUrl: `/api/translate/translation/test-docx?action=download&fileId=${fileId}`,
    });
  } catch (error) {
    console.error('테스트 DOCX 생성 중 오류:', error);
    res.status(500).json({
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
