import { api } from "./api.js";

const maxLevelInput = document.getElementById("maxLevel");

maxLevelInput.addEventListener("change", async () => {
  let val = parseInt(maxLevelInput.value, 10);
  if (isNaN(val) || val < 0) {
    val = 3;
    maxLevelInput.value = val;
  }
  console.debug(`[Splunk Json Expander] Setting expansionLevel to ${val}`);
  await api.storage.sync.set({ expansionLevel: val });
});

// Initial load
(async () => {
  console.debug("[Splunk Json Expander] Initializing...");
  const { expansionLevel = 3 } = await api.storage.sync.get(["expansionLevel"]);
  console.debug(
    `[Splunk Json Expander] Loaded settings - expansionLevel: ${expansionLevel}`,
  );
  maxLevelInput.value = expansionLevel;
})();
