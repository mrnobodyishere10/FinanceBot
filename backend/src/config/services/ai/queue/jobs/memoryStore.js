const memory = {};
export const memoryStore = {
  set(key, value) { memory[key] = value; },
  get(key) { return memory[key]; },
  delete(key) { delete memory[key]; },
};
