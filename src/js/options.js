import { api } from "./api.js";

const maxLevelInput = document.getElementById("maxLevel");

maxLevelInput.addEventListener("change", async () => {
  const rawValue = maxLevelInput.value.trim();
  let val = parseInt(rawValue, 10);

  if (rawValue === "") {
    val = 0;
  } else if (isNaN(val) || val < 1) {
    val = 3;
    maxLevelInput.value = val;
  }

  console.debug(`[Splunk Json Expander] Setting expansionLevel to ${val}`);
  await api.storage.sync.set({ expansionLevel: val });
});

// Initial load
(async () => {
  console.debug("[Splunk Json Expander] Initializing...");
  const result = await api.storage.sync.get(["expansionLevel"]);
  const expansionLevel = result.expansionLevel ?? 3;
  console.debug(
    `[Splunk Json Expander] Loaded settings - expansionLevel: ${expansionLevel}`,
  );
  maxLevelInput.value = expansionLevel === 0 ? "" : expansionLevel;
})();
