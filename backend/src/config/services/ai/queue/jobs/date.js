export const dateUtil = {
  now() { return new Date(); },
  tomorrow() { return new Date(Date.now() + 24*60*60*1000); }
};
