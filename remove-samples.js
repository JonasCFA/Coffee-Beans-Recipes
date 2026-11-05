(function () {
  const keys = ["daily-pour-coffee-journal-v4", "daily-pour-coffee-journal-v3", "daily-pour-coffee-journal-v2", "daily-pour-coffee-journal-v1"];
  const removed = new Set(["monsoon reserve", "velvet cherry", "yirgacheffe sunrise", "yirgaffe sunrise", "maya estate"]);
  for (const key of keys) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;
      const beans = JSON.parse(stored);
      if (!Array.isArray(beans)) continue;
      const remaining = beans.filter((bean) => !removed.has(String(bean.name || "").trim().toLowerCase()));
      if (remaining.length !== beans.length) localStorage.setItem(key, JSON.stringify(remaining));
    } catch (error) {
      console.warn(`Could not remove demo beans from ${key}`, error);
    }
  }
})();
