import { api } from "./api.js";

const isFirefox = navigator.userAgent.includes("Firefox");

async function inject(tabId) {
  try {
    await api.scripting.executeScript({
      target: { tabId },
      func: () => {
        window.__splunkJsonExpanderManualTrigger = true;
      },
    });
    await api.scripting.executeScript({
      target: { tabId },
      files: ["js/content.js"],
    });
  } catch (error) {
    console.error(
      `[Splunk Json Expander] Failed to inject content script:`,
      error,
    );
  }
}

const originToMatchPattern = (origin) =>
  origin === "<all_urls>"
    ? "*://*/*/search*"
    : `${origin.replace(/\/\*?$|\/$/, "")}/*/search*`;

async function updateDynamicScripts() {
  try {
    const { origins = [] } = await api.permissions.getAll();
    const validOrigins = origins.filter(
      (o) => o.includes("://") || o === "<all_urls>",
    );

    const existing = await api.scripting
      .getRegisteredContentScripts()
      .catch(() => []);
    if (existing.some((s) => s.id === "dynamic-splunk-expander")) {
      await api.scripting
        .unregisterContentScripts({ ids: ["dynamic-splunk-expander"] })
        .catch(() => {});
    }

    if (validOrigins.length > 0) {
      await api.scripting.registerContentScripts([
        {
          id: "dynamic-splunk-expander",
          js: ["js/content.js"],
          matches: validOrigins.map(originToMatchPattern),
          runAt: "document_idle",
        },
      ]);
    }
  } catch (error) {
    console.error(
      "[Splunk Json Expander] Error updating dynamic content scripts:",
      error,
    );
  }
}

async function updateContextMenuForTab(url) {
  if (isFirefox) return;

  let hasPerm = false;
  if (url?.startsWith("http://") || url?.startsWith("https://")) {
    const { protocol, host } = new URL(url);
    hasPerm = await api.permissions
      .contains({ origins: [`${protocol}//${host}/*`] })
      .catch(() => false);
  }

  try {
    await api.contextMenus.update("always-run-add", { visible: !hasPerm });
    await api.contextMenus.update("always-run-remove", { visible: hasPerm });
  } catch (e) {}
}

async function refreshContextMenu() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (tab) await updateContextMenuForTab(tab.url);
}

// Event Listeners
api.action.onClicked.addListener(async (tab) => {
  if (tab?.id && tab?.url) await inject(tab.id);
});

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

api.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await api.tabs.get(tabId).catch(() => null);
  if (tab) await updateContextMenuForTab(tab.url);
});

api.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    const [activeTab] = await api.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab?.id === tabId) await updateContextMenuForTab(tab.url);
  }
});

api.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.url?.startsWith("http")) return;

  const { protocol, host } = new URL(tab.url);
  const originPattern = `${protocol}//${host}/*`;

  if (info.menuItemId === "always-run-add") {
    if (await api.permissions.request({ origins: [originPattern] })) {
      await inject(tab.id);
      await refreshContextMenu();
    }
  } else if (info.menuItemId === "always-run-remove") {
    if (
      await api.permissions
        .remove({ origins: [originPattern] })
        .catch(() => false)
    ) {
      await refreshContextMenu();
    }
  }
});

const syncState = () => {
  updateDynamicScripts();
  refreshContextMenu();
};
api.permissions.onAdded.addListener(syncState);
api.permissions.onRemoved.addListener(syncState);

// Initialization
updateDynamicScripts();
