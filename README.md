# JSON Expander for Splunk

A browser extension for Chrome and Firefox that instantly expands JSON objects in Splunk search results.

Splunk's default view collapses nested JSON data, requiring tedious manual clicks to inspect your logs. This extension automates the process with a single click so you can focus on analysis.

## Features

- **One-Click Expansion**: Click the extension icon to instantly expand JSON results on the active page.
- **Customizable Depth**: Configure how many levels deep the JSON should be expanded (defaults to 3).
- **Expand All**: Set the depth to `0` to fully expand all nested JSON objects.
- **Privacy First**: It only runs when and where you explicitly click the icon.
- **Cross-Browser**: Built with Manifest V3 for modern Chrome and Firefox compatibility.

## Usage

1. Open your Splunk search results.
2. Click the **JSON Expander for Splunk** icon in your browser toolbar.
3. The JSON logs will immediately expand to your configured depth.

## Configuration

You can change the default expansion depth via the extension options:

1. Open the extension's option page:
   - Chrome:
     1. Right-click the extension icon
        Click `Options`
   - Firefox:
     1. Right-click the extension icon
     2. Click `Manage extension`
     3. Go to the `Options` tab
2. Enter your preferred expansion level (use `0` for infinite depth).

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

To verify code formatting and run `web-ext lint` (recommended before opening a pull request):

```bash
npm run check
```

### Build

To build the extension artifacts:

```bash
npm run build
```
