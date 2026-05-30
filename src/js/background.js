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
      func: () => {
        window.__splunkJsonExpanderManualTrigger = true;
      },
      target: { tabId: tabId },
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

/**
 * Helper to convert an origin or URL pattern to a Splunk search page match pattern.
 */
function originToMatchPattern(origin) {
  let base = origin;
  if (base === "<all_urls>") {
    return "*://*/*/search*";
  }
  if (base.endsWith("/*")) {
    base = base.slice(0, -2);
  } else if (base.endsWith("/")) {
    base = base.slice(0, -1);
  }
  return `${base}/*/search*`;
}

/**
 * Dynamically registers content scripts for all currently granted origins.
 */
async function updateDynamicScripts() {
  console.debug("[Splunk Json Expander] Updating dynamic content scripts...");
  try {
    const permissions = await api.permissions.getAll();
    const origins = (permissions.origins || []).filter(
      (o) => o.includes("://") || o === "<all_urls>",
    );

    // Unregister existing content scripts to avoid duplicate registration error
    try {
      const existing = await api.scripting.getRegisteredContentScripts();
      if (existing.some((s) => s.id === "dynamic-splunk-expander")) {
        await api.scripting.unregisterContentScripts({
          ids: ["dynamic-splunk-expander"],
        });
      }
    } catch (e) {
      console.debug(
        "[Splunk Json Expander] No existing scripts to unregister or error: ",
        e,
      );
    }

    if (origins.length > 0) {
      const matches = origins.map(originToMatchPattern);
      await api.scripting.registerContentScripts([
        {
          id: "dynamic-splunk-expander",
          js: ["js/content.js"],
          matches: matches,
          runAt: "document_idle",
        },
      ]);
      console.info(
        "[Splunk Json Expander] Registered dynamic content scripts for matches:",
        matches,
      );
    } else {
      console.info("[Splunk Json Expander] No dynamic origins to register.");
    }
  } catch (error) {
    console.error(
      "[Splunk Json Expander] Error updating dynamic content scripts:",
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

const isFirefox = navigator.userAgent.includes("Firefox");

async function updateContextMenuForTab(tabId, url) {
  if (isFirefox) return;

  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    try {
      await api.contextMenus.update("always-run-add", { visible: true });
      await api.contextMenus.update("always-run-remove", { visible: false });
    } catch (e) {}
    return;
  }

  try {
    const urlObj = new URL(url);
    const originPattern = `${urlObj.protocol}//${urlObj.host}/*`;
    const hasPerm = await api.permissions.contains({
      origins: [originPattern],
    });

    if (hasPerm) {
      await api.contextMenus.update("always-run-add", { visible: false });
      await api.contextMenus.update("always-run-remove", { visible: true });
    } else {
      await api.contextMenus.update("always-run-add", { visible: true });
      await api.contextMenus.update("always-run-remove", { visible: false });
    }
  } catch (e) {
    console.error(e);
  }
}

api.runtime.onInstalled.addListener(() => {
  if (isFirefox) return;
  api.contextMenus.create({
    id: "always-run-add",
    title: "Always run on this domain",
    contexts: ["action"],
    visible: true,
  });
  api.contextMenus.create({
    id: "always-run-remove",
    title: "✓ Always run on this domain",
    contexts: ["action"],
    visible: false,
  });
});

api.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await api.tabs.get(activeInfo.tabId);
    if (tab) await updateContextMenuForTab(tab.id, tab.url);
  } catch (e) {}
});

api.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url !== undefined || changeInfo.status === "complete") {
    try {
      const [activeTab] = await api.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (activeTab && activeTab.id === tabId) {
        await updateContextMenuForTab(tabId, tab.url);
      }
    } catch (e) {}
  }
});

async function refreshContextMenu() {
  try {
    const [activeTab] = await api.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab) await updateContextMenuForTab(activeTab.id, activeTab.url);
  } catch (e) {}
}

api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab.url || !tab.id) return;
  try {
    if (tab.url.startsWith("http://") || tab.url.startsWith("https://")) {
      const url = new URL(tab.url);
      const originPattern = `${url.protocol}//${url.host}/*`;

      if (info.menuItemId === "always-run-add") {
        console.info(
          `[Splunk Json Expander] Requesting persistent permission for ${originPattern}`,
        );
        const granted = await api.permissions.request({
          origins: [originPattern],
        });
        if (granted) {
          console.info(
            `[Splunk Json Expander] Persistent permission granted for ${originPattern}`,
          );
          await inject(tab.id);
          await refreshContextMenu();
        }
      } else if (info.menuItemId === "always-run-remove") {
        console.info(
          `[Splunk Json Expander] Removing persistent permission for ${originPattern}`,
        );
        let removed = false;
        try {
          removed = await api.permissions.remove({ origins: [originPattern] });
        } catch (e) {
          console.error(
            "[Splunk Json Expander] Failed to remove permission:",
            e,
          );
        }
        if (removed) {
          console.info(
            `[Splunk Json Expander] Persistent permission removed for ${originPattern}`,
          );
          await refreshContextMenu();
          try {
            await api.scripting.executeScript({
              target: { tabId: tab.id },
              func: (domain) =>
                alert(
                  `Splunk JSON Expander: Automatic execution disabled for ${domain}.`,
                ),
              args: [url.host],
            });
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.error(
      "[Splunk Json Expander] Error modifying permissions from context menu:",
      e,
    );
  }
});

// Watch for permission changes to sync the registered content scripts
api.permissions.onAdded.addListener(() => {
  updateDynamicScripts();
  refreshContextMenu();
});
api.permissions.onRemoved.addListener(() => {
  updateDynamicScripts();
  refreshContextMenu();
});

// Initialize scripts registration on background startup
updateDynamicScripts();

console.debug("[Splunk Json Expander] Service worker initialized.");
