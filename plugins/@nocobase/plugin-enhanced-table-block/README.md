# @nocobase/plugin-enhanced-table-block

## Introduction

`@nocobase/plugin-enhanced-table-block` is an enhanced table block plugin for NocoBase. It provides advanced tabular features to improve data visualization and manipulation within your application.

## Features

- **Summary Row:** Automatically display a summary row at the bottom of the table to show aggregated data (e.g., sums, averages, counts).
- **Cell Selection Sum:** Quickly calculate the sum of selected cells by simply highlighting them in the table.
- **Enhanced Cell Interaction:** Improved user experience for interacting with table cells and content.
- **Cross-Version Support:** Compatible with both V1 and V2 NocoBase pages.

## Installation

This plugin is a core block in NocoBase. If it is not enabled, you can install and enable it via the NocoBase Admin Plugin Manager or via CLI:

```bash
yarn nocobase plugin install @nocobase/plugin-enhanced-table-block
```

## Usage

1. Go to any page in your NocoBase application where you want to add a table.
2. Click **Add block** and select **Enhanced Table**.
3. Configure the data source and collection.
4. Enable the **Summary Row** feature in the block settings to automatically calculate and display aggregations for specific columns.
5. In the live view, drag to select multiple numerical cells to view their instant sum in the UI.

## Changelog

**v2.1.0-beta.7**
- **Refactoring:** Replaced the pure regex-based validation with an accurate underlying metadata type-checking logic (DOM to field-type mapping) to exclude dates, times, and non-numerical text from sums.
- **Fix:** Removed drag-prevention hooks to restore accurate single-cell text selection and copying actions across modern browsers.
- **Enhancement:** Hover stats for cell selection is now confined to >1 cell selections, reducing UI noise on simple table clicks.
- **Enhancement:** Multi-cell select stats popup now aggregates comprehensive info including `Max`, `Min`, `Average`, and selected counts rather than just a simplistic total sum.
- **Style Fix:** Renamed occurrences of "Summary Row", and enforced strictly right-aligned data content inside the bottom bar.

**v2.1.0-beta**
- **Fix:** Resolved a V1 page incompatibility resulting in 404 block requests that crippled the calculation script from retrieving all table data.
- **Enhancement:** Unqualified column titles (like Rich Text, JSON, and Arrays) are strictly hidden rather than simply greyed-out toggles inside the configuration toolbar.
- **Fix:** Addressed the missing i18n variables making the module unidentifiable across newer preset setups.

## License

AGPL-3.0
