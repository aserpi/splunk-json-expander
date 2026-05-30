(async () => {
  console.debug("[Splunk JSON Expander] Content script initialized.");

  // If the script is executed a second time (e.g., via manual extension click),
  // force the expansion immediately regardless of the autoExpand setting.
  const isManualTrigger = window.__splunkJsonExpanderManualTrigger;
  delete window.__splunkJsonExpanderManualTrigger;

  if (window.__splunkJsonExpanderLoaded) {
    console.debug(
      "[Splunk JSON Expander] Script already loaded. Forcing manual expansion.",
    );
    await window.__splunkJsonExpanderForceExpand?.();
    return;
  }
  window.__splunkJsonExpanderLoaded = true;

  const api = globalThis.browser || globalThis.chrome;

  /**
   * Calculates the logical depth of a JSON expander by counting ancestor toggles.
   */
  const getDepth = (el) => {
    const parentLevel = el.parentElement?.closest("[data-ext-level]");
    return parentLevel
      ? parseInt(parentLevel.getAttribute("data-ext-level"), 10) + 1
      : 1;
  };

  /**
   * Click all unexpanded `a.jsexpands` links. Returns true if any expander
   * was clicked, false if none remain.
   */
  const expandOnce = (maxDepth) => {
    const expanders = document.querySelectorAll(
      "a.jsexpands:not([data-expanded-by-ext])",
    );
    const visibleExpanders = [];

    for (const el of expanders) {
      // Revert to offsetWidth/Height check as Splunk's dynamic DOM might not play well with checkVisibility
      if (el.offsetHeight > 0 || el.offsetWidth > 0) {
        const depth = getDepth(el);
        if (maxDepth === undefined || depth <= maxDepth) {
          visibleExpanders.push({ el, depth });
        } else {
          el.setAttribute("data-expanded-by-ext", "skipped");
        }
      }
    }

    if (visibleExpanders.length === 0) return false;

    for (const item of visibleExpanders) {
      item.el.setAttribute("data-expanded-by-ext", "true");
      if (item.el.parentElement) {
        item.el.parentElement.setAttribute("data-ext-level", item.depth);
      }
      item.el.click();
    }
    return true;
  };

  const expandAll = (maxDepth) => {
    let pass = 0;
    while (expandOnce(maxDepth)) pass++;

    if (pass > 0) {
      setTimeout(() => {
        document.querySelector("div.modalize-table-overlay")?.click();
      }, 2);
    }
    return pass;
  };

  // Placeholder and state to handle clicks during async storage fetch
  let isReady = false;
  let pendingManualTrigger = isManualTrigger;
  let targetDepth = 0;

  window.__splunkJsonExpanderForceExpand = async () => {
    if (!isReady) {
      pendingManualTrigger = true;
      return;
    }

    console.info(
      "[Splunk JSON Expander] Manual expansion triggered via icon click.",
    );

    const { expansionLevel = 3 } = await api.storage.sync.get([
      "expansionLevel",
    ]);
    const newMaxLevel = Number(expansionLevel ?? 3);
    targetDepth =
      Number.isNaN(newMaxLevel) || newMaxLevel === 0 ? undefined : newMaxLevel;

    document
      .querySelectorAll('a.jsexpands[data-expanded-by-ext="skipped"]')
      .forEach((el) => {
        el.removeAttribute("data-expanded-by-ext");
        if (el.parentElement) {
          el.parentElement.setAttribute("data-ext-level", "0");
        }
      });

    expandAll(targetDepth);
  };

  // Fetch config and initialize
  const { expansionLevel = 3 } = await api.storage.sync.get(["expansionLevel"]);
  const maxLevel = Number(expansionLevel ?? 3);
  targetDepth = Number.isNaN(maxLevel) || maxLevel === 0 ? undefined : maxLevel;
  isReady = true;

  console.info(
    `[Splunk JSON Expander] Config loaded - targetDepth: ${targetDepth}`,
  );

  if (pendingManualTrigger) {
    await window.__splunkJsonExpanderForceExpand();
  } else {
    console.info("[Splunk JSON Expander] Running initial expansion.");
    expandAll(targetDepth);
  }

  console.info(
    "[Splunk JSON Expander] Setting up MutationObserver to handle async rendering.",
  );
  let mutationTimeout = null;
  new MutationObserver((mutations) => {
    let hasNewExpanders = false;
    for (const mut of mutations) {
      if (mut.type !== "childList" || !mut.addedNodes.length) continue;

      for (const node of mut.addedNodes) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node.matches("a.jsexpands") || node.querySelector("a.jsexpands"))
        ) {
          hasNewExpanders = true;
          break;
        }
      }
      if (hasNewExpanders) break;
    }

    if (hasNewExpanders) {
      if (mutationTimeout) cancelAnimationFrame(mutationTimeout);
      mutationTimeout = requestAnimationFrame(() => expandAll(targetDepth));
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
