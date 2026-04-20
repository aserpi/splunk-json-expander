import { api } from "./api.js";

/**
 * Core logic to check if the current tab is a Splunk search page and inject the
 * expansion script.
 */
async function inject(tabId) {
  console.debug(`[Splunk Json Expander] inject called for tabId: ${tabId}`);

  console.info(
    `[Splunk Json Expander] Executing content script for tabId: ${tabId}`,
  );
  try {
    await api.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        window.__splunkJsonExpanderManualTrigger = true;
      },
    });
    await api.scripting.executeScript({
      files: ["js/content.js"],
      target: { tabId: tabId },
    });
    console.info(
      `[Splunk Json Expander] Content script executed successfully for tabId: ${tabId}`,
    );
  } catch (error) {
    console.error(
      `[Splunk Json Expander] Failed to execute content script for tabId: ${tabId}`,
      error,
    );
  }
}

// Run when the user clicks the extension icon
api.action.onClicked.addListener(async (tab) => {
  console.debug(
    `[Splunk Json Expander] Extension icon clicked for tabId: ${tab.id}, url: ${tab.url}`,
  );
  if (!tab.url || !tab.id) {
    console.warn(
      `[Splunk Json Expander] Action click received but tab has no url or id. tabId: ${tab.id}`,
    );
    return;
  }

  try {
    await inject(tab.id);
  } catch (e) {
    console.error("[Splunk Json Expander] Error handling action click:", e);
  }
});

console.debug("[Splunk Json Expander] Service worker initialized.");
