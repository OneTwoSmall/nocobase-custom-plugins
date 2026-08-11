# @onetwosmall/plugin-system-enhancement

System enhancement features for NocoBase (2.x, v2 runtime): login page customization, logo link navigation, and enhanced tables (summary row, cell selection stats, column drag resize).

> v1 client runtime is no longer supported. An inert client entry is kept only so the plugin loads cleanly in v1 applications.

## Features

### Login Page Customization

- Background image (SVG, GIF, PNG, JPG, WebP)
- Form position (left / center / right) with horizontal and vertical offset
- Title font settings (size, weight, color)
- Background settings (size, repeat, position)
- Live preview and reset

### Logo Link

- Click the top-left logo to navigate to a custom path (e.g. `/admin`)
- Only relative paths within the current system are allowed (server-side validation)

### Table Enhancement

The summary row and cell selection stats are integrated into **native table blocks** (v2 flow runtime) by overriding the `TableBlockModel` registration — no changes to the original table block code are required.

- **Summary row**: per-column aggregation (sum / average / count / min / max) over all matching data (all pages), rendered as a sticky footer row
- **Cell selection stats**: drag to select a range of cells in numeric columns to see sum / max / min / average / count
- **Column drag resize**: drag column header borders to resize columns

The wrapper logic (summary row + cell selection) is only activated after a summary config is set on the block.

## Getting Started

Enable the plugin in the plugin manager, then:

1. **Settings**: System Enhancement → Table Enhancement / Login Page Customization / Logo Link
2. **Summary row**: open a table block's settings flow → "Enhanced table settings" → "Summary row settings", pick aggregation types per numeric column
3. **Column resize**: drag the column header border

## Compatibility

- NocoBase 2.x, v2 (flow-engine) runtime only
- The standalone "Enhanced Table" block (`use: 'EnhancedTableBlockModel'`) is no longer registered; pages that used it should be rebuilt with the native table block

## Development

```bash
# run a single test file
yarn test packages/plugins/@onetwosmall/plugin-system-enhancement/src/client-v2/enhanced-table/__tests__/computeSummary.test.ts

# type check
yarn tsc -p tsconfig.json

# lint
yarn eslint --fix packages/plugins/@onetwosmall/plugin-system-enhancement/src
```

## Changelog

### v2.2.0-beta.17 (2026-08-11)

- Integrate the summary row feature into native table blocks by overriding the `TableBlockModel` registration; all native table blocks (including existing saved pages) gain the feature automatically
- Only activate the wrapper logic (summary row + cell selection stats) once a summary config is set
- Fix the selection stats popup not interpolating `{{num}}` (i18n options are now passed through `useT`)
- Fix the login page background image not loading for anonymous users (serve it through a dedicated public endpoint with image-type validation and safe response headers such as `X-Content-Type-Options: nosniff` and CSP `sandbox` for SVG; the client reads the attachment id from the scalar `loginBackgroundImageId` field, and the attachment itself stays private)
- Drop v1 client support; keep an inert v1 client entry to avoid RequireJS load errors in the v1 runtime
- Align the plugin version with the next branch (`2.2.0-beta.17`) and resync `yarn.lock`
- Adapt tests to next APIs (explicit vitest imports, `createModelOptions` union-type narrowing)

### v2.2.0-beta.5 (2026-07-03 ~ 2026-08-10)

- Add the `systemEnhancementSettings` collection and ACL protection for settings persistence
- Add login page customization
- Add logo link navigation (relative-path validation)
- Add the enhanced table block with a summary row and cell selection stats (standalone block)

## License

Copyright © 2026 OneTwoSmall

This project is dual-licensed under AGPL-3.0 and a commercial license.
For commercial licensing (e.g., closed-source deployment), please contact: moonship1011@gmail.com.
