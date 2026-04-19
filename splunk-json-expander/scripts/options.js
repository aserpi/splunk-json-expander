import { api } from "./api.js";

const maxLevelInput = document.getElementById("maxLevel");

maxLevelInput.addEventListener("change", async () => {
  let val = parseInt(maxLevelInput.value, 10);
  if (isNaN(val) || val < 0) {
    val = 3; // Fallback to default if invalid or negative
    maxLevelInput.value = val;
  }
  await api.storage.sync.set({ maxExpansionLevel: val });
});

// Initial load
(async () => {
  const { maxExpansionLevel = 3 } =
    await api.storage.sync.get("maxExpansionLevel");
  maxLevelInput.value = maxExpansionLevel;
})();
