import { Worker } from 'bullmq';

export const queue = {
  addJob(name, data) {
    console.log(`Queueing job ${name}`, data);
  },
};
