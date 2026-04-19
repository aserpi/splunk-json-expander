import { api } from "./api.js";

/**
 * Core logic to check if the current tab is a Splunk search page and inject the
 * expansion script.
 */
async function inject(tabId, tabUrl) {
  const url = new URL(tabUrl);

  // Matches /<LOCALE>/app/<APP>/search
  const isSplunkSearchPath = /^\/[^/]+\/app\/[^/]+\/search/.test(url.pathname);

  if (isSplunkSearchPath) {
    await api.scripting.executeScript({
      files: ["scripts/content.js"],
      target: { tabId: tabId },
    });
  }
}

// Run when the user clicks the extension icon
api.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.id) return;

  try {
    await inject(tab.id, tab.url);
  } catch (e) {
    console.error("Error handling action click:", e);
  }
});
