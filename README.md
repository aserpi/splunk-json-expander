# JSON Expander for Splunk

A browser extension for Chrome and Firefox that instantly expands JSON objects in Splunk search results.

Splunk's default view collapses nested JSON data, requiring tedious manual clicks to inspect your logs.
This extension automates the process so you can focus on analysis.

[link-firefox]: https://addons.mozilla.org/it/firefox/addon/splunk-json-expander/ "Version published on Mozilla Add-ons"

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/firefox/firefox.svg" width="48" alt="Firefox" valign="middle">][link-firefox] [<img valign="middle" src="https://img.shields.io/amo/v/splunk-json-expander.svg?label=%20">][link-firefox]&emsp;Download it at [addons.mozilla.org][link-firefox].

## Features

- **Automatic expansion**: When you allow a domain, JSON results expand automatically as soon as they are loaded.
- **One-click expansion**: Click the extension icon to instantly expand JSON results on any Splunk page without permanently allowing the domain.
- **Customizable depth**: Independently configure how many levels deep the JSON should be expanded for both automatic and manual triggers (leave empty for all levels).
- **Cross-browser**: Built with Manifest V3 for modern Chrome and Firefox compatibility.

## Usage

### Automatic expansion

If you use Splunk frequently on a specific domain, you can allow the extension to run automatically:

#### Chrome / Edge

1. Navigate to your Splunk domain.
2. Open the extension's context menu:
   - If you pinned the extension, right-click the extension icon.
   - If you did not pin the extension, click on the three dots on the right of the icon.
3. Click **Always run on this domain**. The extension will now automatically expand JSON logs whenever you visit this site.<br>
   To disable, open the context menu again and select **✓ Always run on this domain**.

#### Firefox

Firefox manages site permissions natively:

1. Navigate to your Splunk domain.
2. Open the extension's context menu:
   - If you pinned the extension, right-click the extension icon.
   - If you did not pin the extension, click on the gearwheel on the right of the icon.
3. Select **Always allow on [domain]**

To remove the site permission, you can either:

- Navigate to the website and do it from the extension's context menu.
- Go to the options page and uncheck the domain.

### Manual trigger

If you prefer not to grant persistent permissions, you can always run the extension on-demand by clicking the extension icon.
The JSON logs will immediately expand to your configured manual depth.
You can also click the extension icon again to expand the logs further by the configured manual depth.

## Configuration

You can customize the extension's expansion behavior in the options page:

1. Open the extension's option page.
2. **Auto-expansion level**: Set the maximum number of nested levels to be expanded automatically on page load (leave empty to expand all levels).
3. **Manual expansion level**: Set the number of nested levels to be expanded when clicking the extension icon (leave empty to expand all levels).

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
