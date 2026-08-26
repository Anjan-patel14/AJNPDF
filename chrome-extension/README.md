# AJN PDF Quick Tools — Chrome Extension 1.0.0

AJN PDF Quick Tools is a Manifest V3 Chrome extension designed around a narrow, reviewable purpose: fast file preparation and discovery from Chrome.

## Extension-native functionality

- Image to PDF: combines up to 20 selected browser-supported images into one PDF in an extension page.
- Reduce Image: creates a smaller JPG or WEBP copy with a user-selected quality level.
- Resize Image: changes image width while preserving aspect ratio.
- Convert Image: converts a selected image to JPG, PNG or WEBP.
- Tool search: searches the audited 107 AJN PDF public workflows and opens the selected workflow on ajnpdf.com.
- Recent tools are stored only in extension-page localStorage.

## Permission design

The manifest declares no `permissions`, no `host_permissions`, no content scripts and no background service worker. The extension does not read page content, browsing history, passwords, cookies or open-tab content.

The extension uses `chrome.tabs.create()` to open user-selected AJN PDF pages. Chrome documents that creating a new tab does not require the `tabs` permission.

## Manifest V3 / remote code

All runtime HTML, CSS and JavaScript are packaged with the extension. There are no remotely hosted scripts, no `eval`, no dynamic code fetching and no remote logic.

## Local test

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this `chrome-extension` folder.
5. Pin AJN PDF Quick Tools if desired.
6. Test all four native quick actions with non-sensitive sample images.

## Store package

Use the generated `AJN-PDF-CHROME-EXTENSION-1.0.0.zip` for the Chrome Web Store package upload. Its `manifest.json` is at the ZIP root.
