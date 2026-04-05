import { reportService } from '../services/reportService.js';
export const weeklyReport = async () => {
  console.log('Generating weekly reports...');
  await reportService.generateAll();
};
