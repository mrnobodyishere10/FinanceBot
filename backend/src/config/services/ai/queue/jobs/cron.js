import cron from 'node-cron';

export const scheduleJobs = () => {
  cron.schedule('0 0 * * *', () => console.log('Daily job running...'));
};