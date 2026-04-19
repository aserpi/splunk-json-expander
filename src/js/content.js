(async () => {
  console.debug("Trying to expand JSON documents...");

  const api = globalThis.browser || globalThis.chrome;
  const rawSettings = await api.storage.sync.get("maxExpansionLevel");
  const maxLevel = Number(rawSettings.maxExpansionLevel ?? 3);

  // To expand multiple levels, we need to click each expander button
  let currentDepth = 0;
  while (true) {
    // 0 means infinite expansion, otherwise stop at maxExpansionLevel
    if (maxLevel !== 0 && currentDepth >= maxLevel) break;

    const expanders = Array.from(
      document.querySelectorAll("a.jsexpands"),
    ).filter((el) => !el.hasAttribute("data-expanded-by-ext"));

    if (expanders.length === 0) break;

    expanders.forEach((expander) => {
      expander.setAttribute("data-expanded-by-ext", "true");
      expander.click();
    });
    currentDepth++;
  }

  // Remove overlays after expansion
  await new Promise((resolve) => setTimeout(resolve, 1));
  document.querySelector(".modalize-table-top")?.click();

  console.debug(
    `JSON documents expanded (Level: ${maxLevel === 0 ? "Full" : currentDepth}).`,
  );
})();
