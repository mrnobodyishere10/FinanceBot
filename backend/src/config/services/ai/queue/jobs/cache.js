const cacheStore = new Map();
export const cache = {
  set(key, value, ttl = 60) {
    cacheStore.set(key, { value, expires: Date.now() + ttl * 1000 });
  },
  get(key) {
    const data = cacheStore.get(key);
    if (!data) return null;
    if (Date.now() > data.expires) {
      cacheStore.delete(key);
      return null;
    }
    return data.value;
  }
};
