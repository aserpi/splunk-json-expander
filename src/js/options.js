import { api } from "./api.js";

const isFirefox = navigator.userAgent.includes("Firefox");

const addDomainBtn = document.getElementById("addDomain");
const autoExpandInput = document.getElementById("autoExpand");
const domainList = document.getElementById("domainList");
const maxLevelInput = document.getElementById("maxLevel");
const newDomainInput = document.getElementById("newDomain");

autoExpandInput.addEventListener("change", async () => {
  console.debug(
    `[Splunk Json Expander] Setting autoExpand to ${autoExpandInput.checked}`,
  );
  await api.storage.sync.set({ autoExpand: autoExpandInput.checked });
});

maxLevelInput.addEventListener("change", async () => {
  let val = parseInt(maxLevelInput.value, 10);
  if (isNaN(val) || val < 0) {
    val = 3;
    maxLevelInput.value = val;
  }
  console.debug(`[Splunk Json Expander] Setting expansionLevel to ${val}`);
  await api.storage.sync.set({ expansionLevel: val });
});

/**
 * Processes a raw domain string into a valid browser match pattern.
 * Normalizes input to *://FQDN/* to avoid path-based inconsistencies.
 * @param {string} domain - The raw domain string from user input.
 * @returns {string | null} A formatted match pattern, or null if input is empty.
 */
function processDomain(domain) {
  let input = domain.trim();
  if (input.length === 0) return null;

  let host = input;
  let protocol = "*";

  if (input.includes("://")) {
    const parts = input.split("://");
    protocol = parts[0];
    host = parts[1];
  }

  // Strip any path from the host
  host = host.split("/")[0];

  if (host.length === 0) return null;

  return `${protocol}://${host}/*`;
}

/**
 * Renders the list of currently granted domain permissions.
 */
async function renderDomainList() {
  if (!isFirefox) return;

  domainList.innerHTML = ""; // Clear current list
  const permissions = await api.permissions.getAll();
  console.debug("[Splunk Json Expander] Fetched permissions:", permissions);

  // Origins are match patterns. We filter and sort them for display.
  const origins = (permissions.origins || [])
    .filter((o) => o.includes("://"))
    .sort();

  console.info(`[Splunk Json Expander] Rendering ${origins.length} domain(s)`);

  origins.forEach((fullPattern) => {
    const checkbox = document.createElement("input");
    const label = document.createElement("label");
    const listItem = document.createElement("li");
    const span = document.createElement("span");

    checkbox.checked = true;
    checkbox.type = "checkbox";

    // Clean up display: remove the trailing /* but keep the protocol
    let displayValue = fullPattern;
    if (displayValue.endsWith("/*")) displayValue = displayValue.slice(0, -2);
    span.textContent = displayValue;

    checkbox.addEventListener("change", async (event) => {
      if (!event.target.checked) {
        console.info(
          `[Splunk Json Expander] Attempting to remove permission for ${fullPattern}`,
        );
        try {
          const removed = await api.permissions.remove({
            origins: [fullPattern],
          });
          if (removed) {
            console.info(
              `[Splunk Json Expander] Successfully removed permission for ${fullPattern}`,
            );
            listItem.remove(); // Remove from DOM on success
          } else {
            console.warn(
              `[Splunk Json Expander] Failed to remove permission for ${fullPattern}`,
            );
            event.target.checked = true; // Revert checkbox if removal fails
            alert("Failed to remove permission. Please try again.");
          }
        } catch (error) {
          console.error(
            `[Splunk Json Expander] Error removing permission for ${fullPattern}:`,
            error,
          );
          event.target.checked = true;
          alert("An error occurred while removing the permission.");
        }
      }
    });

    label.appendChild(checkbox);
    label.appendChild(span);
    listItem.appendChild(label);
    domainList.appendChild(listItem);
  });
}

async function handleAddDomain() {
  if (!isFirefox) return;

  const processedDomain = processDomain(newDomainInput.value);
  console.debug(`[Splunk Json Expander] Processed domain: ${processedDomain}`);
  if (!processedDomain) {
    console.debug("[Splunk Json Expander] Invalid or empty domain, skipping.");
    return;
  }

  console.info(
    `[Splunk Json Expander] Requesting permission for ${processedDomain}`,
  );
  try {
    const granted = await api.permissions.request({
      origins: [processedDomain],
    });
    if (granted) {
      console.info(
        `[Splunk Json Expander] Permission granted for ${processedDomain}`,
      );
      newDomainInput.value = "";
    } else {
      console.warn(
        `[Splunk Json Expander] Permission denied for ${processedDomain}`,
      );
    }
  } catch (error) {
    console.error("[Splunk Json Expander] Error requesting permission:", error);
    alert("Invalid domain pattern provided. Please check your formatting.");
  }
}

if (isFirefox) {
  addDomainBtn.addEventListener("click", handleAddDomain);
  newDomainInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddDomain();
    }
  });
}

// Initial load
(async () => {
  console.debug("[Splunk Json Expander] Initializing...");
  const { autoExpand = false, expansionLevel = 3 } = await api.storage.sync.get(
    ["autoExpand", "expansionLevel"],
  );
  console.debug(
    `[Splunk Json Expander] Loaded settings - autoExpand: ${autoExpand}, expansionLevel: ${expansionLevel}`,
  );
  autoExpandInput.checked = autoExpand;
  maxLevelInput.value = expansionLevel;

  if (isFirefox) {
    api.permissions.onAdded.addListener(renderDomainList);
    api.permissions.onRemoved.addListener(renderDomainList);

    await renderDomainList();
  }
})();
