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
   * Click all unexpanded `a.jsexpands` links.
   * Returns true if any expander was clicked, false if none remain.
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

  let currentTargetDepth = 0;
  let initialAutoLevel = undefined;
  // Placeholder and state to handle clicks during async storage fetch
  let isReady = false;
  let pendingManualTrigger = isManualTrigger;

  const parseExpansionLevel = (val) => {
    if (val === "" || val === 0) return undefined;
    const num = parseInt(val, 10);
    return isNaN(num) ? 3 : Math.max(1, num);
  };

  const getSearchId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sid") || window.location.pathname;
  };

  let currentSearchId = getSearchId();
  const observer = new MutationObserver((mutations) => {
    const newSearchId = getSearchId();
    if (currentSearchId !== newSearchId) {
      currentSearchId = newSearchId;
      if (!isManualTrigger) {
        currentTargetDepth = initialAutoLevel;
        console.info(
          "[Splunk JSON Expander] New search detected. Resetting to autoExpansionLevel.",
        );
      } else {
        observer.disconnect();
        console.info(
          "[Splunk JSON Expander] Observer disconnected (new search detected).",
        );
        return;
      }
    }

    const hasNewExpanders = mutations.some(
      (mut) =>
        mut.type === "childList" &&
        Array.from(mut.addedNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches("a.jsexpands") || node.querySelector("a.jsexpands")),
        ),
    );

    if (hasNewExpanders) {
      expandAll(currentTargetDepth);
    }
  });

  if (!isManualTrigger) {
    console.info(
      "[Splunk JSON Expander] Setting up MutationObserver (auto-expand mode).",
    );
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.__splunkJsonExpanderForceExpand = async () => {
    if (!isReady) {
      pendingManualTrigger = true;
      return;
    }

    console.info(
      "[Splunk JSON Expander] Manual expansion triggered via icon click.",
    );

    currentSearchId = getSearchId();

    const result = await api.storage.sync.get(["manualExpansionLevel"]);
    const manualLevel = parseExpansionLevel(result.manualExpansionLevel ?? 0);

    if (manualLevel === undefined || currentTargetDepth === undefined) {
      currentTargetDepth = undefined;
    } else {
      currentTargetDepth += manualLevel;
    }

    // Un-skip previously skipped nodes so they can be evaluated against the new currentTargetDepth
    document
      .querySelectorAll('a.jsexpands[data-expanded-by-ext="skipped"]')
      .forEach((el) => {
        el.removeAttribute("data-expanded-by-ext");
      });

    if (isManualTrigger) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    expandAll(currentTargetDepth);
  };

  // Fetch config and initialize
  const result = await api.storage.sync.get(["autoExpansionLevel"]);
  initialAutoLevel = parseExpansionLevel(result.autoExpansionLevel ?? 3);

  if (!isManualTrigger) {
    currentTargetDepth = initialAutoLevel;
  } else {
    currentTargetDepth = 0;
  }

  isReady = true;

  console.info(
    `[Splunk JSON Expander] Config loaded - currentTargetDepth: ${currentTargetDepth}`,
  );

  if (pendingManualTrigger) {
    await window.__splunkJsonExpanderForceExpand();
  } else {
    console.info("[Splunk JSON Expander] Running initial expansion.");
    expandAll(currentTargetDepth);
  }
})();
