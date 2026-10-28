// 计算 APK 的 SHA-256 与体积，用于填写 README 下载表 / Release 说明。
// 用法：npm run apk:hash -- <path/to/app.apk>
import { createHash } from 'node:crypto';
import { createReadStream, statSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('用法: npm run apk:hash -- <path/to/app.apk>');
  process.exit(1);
}

const hash = createHash('sha256');
const stream = createReadStream(file);

stream.on('error', (err) => {
  console.error(`读取失败: ${err.message}`);
  process.exit(1);
});

stream.on('data', (chunk) => hash.update(chunk));
stream.on('end', () => {
  const bytes = statSync(file).size;
  console.log(`文件    : ${file}`);
  console.log(`体积    : ${(bytes / 1048576).toFixed(2)} MB (${bytes} 字节)`);
  console.log(`SHA-256 : ${hash.digest('hex')}`);
});
