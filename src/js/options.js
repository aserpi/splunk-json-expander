import { api } from "./api.js";

const setupInput = (id, storageKey, defaultValue) => {
  const input = document.getElementById(id);

  input.addEventListener("change", async () => {
    const rawValue = input.value.trim();
    let val = parseInt(rawValue, 10);

    if (rawValue === "") {
      val = 0;
    } else if (isNaN(val) || val < 1) {
      val = defaultValue;
      input.value = val === 0 ? "" : val;
    }

    console.debug(`[Splunk Json Expander] Setting ${storageKey} to ${val}`);
    await api.storage.sync.set({ [storageKey]: val });
  });

  return input;
};

const autoInput = setupInput("autoExpansionLevel", "autoExpansionLevel", 3);
const manualInput = setupInput(
  "manualExpansionLevel",
  "manualExpansionLevel",
  0,
);

// Initial load
(async () => {
  console.debug("[Splunk Json Expander] Initializing...");
  const result = await api.storage.sync.get([
    "autoExpansionLevel",
    "manualExpansionLevel",
  ]);

  const autoLevel = result.autoExpansionLevel ?? 3;
  const manualLevel = result.manualExpansionLevel ?? 0;

  console.debug(
    `[Splunk Json Expander] Loaded settings - auto: ${autoLevel}, manual: ${manualLevel}`,
  );

  autoInput.value = autoLevel === 0 ? "" : autoLevel;
  manualInput.value = manualLevel === 0 ? "" : manualLevel;
})();
