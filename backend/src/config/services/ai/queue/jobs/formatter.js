export const formatter = {
  currency(amount) { return '$' + amount.toFixed(2); },
  date(dt) { return dt.toISOString(); },
};
