export const reportService = {
  async generateReport(userId) {
    console.log(`Generating report for ${userId}`);
    return { pdfUrl: 'https://example.com/report.pdf' };
  },
};
