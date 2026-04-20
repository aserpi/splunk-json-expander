# JSON Expander for Splunk

A browser extension for Chrome and Firefox that instantly expands JSON objects in Splunk search results.

Splunk's default view collapses nested JSON data, requiring tedious manual clicks to inspect your logs.
This extension automates the process so you can focus on analysis.

## Features

- **Automatic Expansion**: Enable auto-expand to have JSON results expand automatically as soon as they are loaded.
- **One-Click Expansion**: Click the extension icon to instantly expand JSON results on any Splunk page.
- **Customizable Depth**: Configure how many levels deep the JSON should be expanded (defaults to 3).
- **Expand All**: Set the depth to `0` to fully expand all nested JSON objects.
- **Domain Management (Firefox)**: Add your own Splunk domains to the allowed list to enable automatic features.
- **Domain Management (Chrome)**: Use the native browser settings (right-click icon > "This can read and change site data") to manage permissions.
- **Cross-Browser**: Built with Manifest V3 for modern Chrome and Firefox compatibility.

## Usage

### Automatic Expansion

#### Firefox

1. Go to the extension **Options**.
2. Add your Splunk domain (e.g., `https://splunk.company.com`) to the **Allowed domains** list.
3. Check the **Enable** box under **Automatic expansion**.

#### Chrome

1. Right-click the extension icon in your toolbar.
2. Select **"This can read and change site data"** > **"On all sites"** (or specify your Splunk domain).
3. Go to extension **Options** and check the **Enable** box under **Automatic expansion**.

### Manual Trigger

1. Open your Splunk search results.
2. Click the **JSON Expander for Splunk** icon in your browser toolbar.
3. The JSON logs will immediately expand to your configured depth.

## Configuration

You can customize the extension behavior in the options page:

1. Open the extension's option page:
   - **Chrome**: Right-click the extension icon and select `Options`.
   - **Firefox**: Right-click the extension icon, select `Manage extension`, and go to the `Options` tab.
2. **Expansion level**: Set the number of levels to expand (use `0` for all).
3. **Automatic expansion**: Toggle whether the extension should run automatically on allowed domains.
4. **Allowed domains (Firefox only)**: Add or remove specific Splunk domains where the extension is permitted to run. On Chrome, use the native browser context menu to manage site permissions.

## Development

This project uses Mozilla's `web-ext` tool for development and building.

### Prerequisites

- Node.js and npm

### Setup

```bash
npm install
```

### Format

To automatically format the code using Prettier:

```bash
npm run format
```

### Check

To verify code formatting and extension correctness run `npm run check` (recommended before opening a pull request):

```bash
npm run check
```

### Build

To build the extension artifacts:

```bash
npm run build
```
