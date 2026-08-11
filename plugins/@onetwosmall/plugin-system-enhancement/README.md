# @onetwosmall/plugin-system-enhancement

System enhancement plugin for NocoBase, providing table enhancements and login page customization.

## Introduction

This plugin adds out-of-the-box system enhancements for NocoBase v2 (V2-Client), including resizable table columns and a fully customizable login page. All settings are managed through a dedicated settings page and take effect immediately without code changes.

## Features

- **Table column resize**: drag the column header divider to resize table and sub-table columns; width can be persisted per page (flow settings) when available
- **Login page customization** (applies to `/signin`, `/signup`, `/forgot-password` and `/reset-password`):
  - Background image upload (SVG, GIF, PNG, JPG, WebP) with size / repeat / position options
  - Form position (left / center / right) with horizontal and vertical offsets in px
  - Title font settings: size, weight and color
  - Live preview panel showing the effect of the current settings before saving
- Settings page with two tabs: **Table Enhancement** and **Login Page Customization**
- Settings collection (`systemEnhancementSettings`) auto-initialized with defaults on first enable

## Installation

Enable the plugin in the NocoBase plugin management page after installation:

```bash
yarn nocobase pm enable @onetwosmall/plugin-system-enhancement
```

## Configuration

After enabling the plugin, open **Settings > System Enhancement** to configure:

| Tab | Option | Description |
| --- | --- | --- |
| Table Enhancement | Enable table column drag resize | Toggles the column resize feature for table and sub-table blocks (enabled by default) |
| Login Page Customization | Background Image | Upload a background image for the login page |
| Login Page Customization | Form Position | Position of the login form: left / center / right |
| Login Page Customization | Horizontal / Vertical Offset (px) | Extra offset of the login form in pixels |
| Login Page Customization | Title Font Settings | Font size, weight and color of the login page title |
| Login Page Customization | Background Settings | Background size, repeat and position |

## Notes

- This plugin targets the NocoBase v2 client runtime (`/v/admin`)
- The `systemEnhancementSettings` collection is publicly readable so the login page styles can be applied before authentication; updates require login
- Custom styles are injected only on authentication pages and are removed automatically when leaving them

## License

This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
For more information, please refer to: https://www.nocobase.com/agreement.
