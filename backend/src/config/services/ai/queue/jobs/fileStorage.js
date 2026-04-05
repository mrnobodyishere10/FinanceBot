import fs from 'fs';
export const fileStorage = {
  save(filePath, content) { fs.writeFileSync(filePath, content); },
  read(filePath) { return fs.readFileSync(filePath, 'utf8'); },
};
