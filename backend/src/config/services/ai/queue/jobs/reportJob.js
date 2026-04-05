import { reportService } from '../../services/reportService.js';
export async function runReportJob(userId) {
  return await reportService.generateReport(userId);
}
