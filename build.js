const fs = require('fs');

// PDF.js 라이브러리 파일 경로 (legacy 버전 사용 중인 것으로 보임)
const dir = 'node_modules/pdfjs-dist/legacy/build/pdf.js';

// 파일 읽기
console.log(`Reading ${dir}...`);
const content = fs.readFileSync(dir, { encoding: 'utf-8' });

// 상대 경로를 절대 경로로 변경
console.log('Replacing worker path reference...');
const modifiedContent = content.replace('\"./pdf.worker.js\";', `__dirname + \"/pdf.worker.js\";`);

// 수정된 내용 쓰기
console.log(`Writing modified content back to ${dir}...`);
fs.writeFileSync(dir, modifiedContent);

console.log('PDF.js worker path patch completed!');
