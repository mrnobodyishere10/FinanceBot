import fs from 'fs';

export const pdfService = {
  async createPDF(content, path) {
    fs.writeFileSync(path, content);
    console.log(`PDF created at ${path}`);
  },
};
