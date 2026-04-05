export const validator = {
  email(str) { return /\S+@\S+\.\S+/.test(str); },
  number(n) { return !isNaN(n); },
};
