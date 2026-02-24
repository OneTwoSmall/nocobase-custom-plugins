# @nocobase/plugin-enhanced-table-block

## 介绍

`@nocobase/plugin-enhanced-table-block` 是 NocoBase 的一款增强表格区块插件。它提供了更加灵活且高级的表格功能，以改善应用程序中的数据可视化和操作体验。

## 特性

- **合计行 (Summary Row)：** 在表格底部自动显示合计行，用于展示聚合数据（如：求和、平均值、计数等）。
- **圈选求和 (Cell Selection Sum)：** 通过在表格中拖拽圈选多个数值单元格，快速计算并显示它们的总和。
- **增强的交互体验：** 优化了表格单元格和内容的交互行为。
- **跨版本兼容：** 同时支持并在 NocoBase 的 V1 和 V2 页面版本中无缝工作。

## 安装

这是 NocoBase 的内置核心区块插件。如果未启用，你可以通过 NocoBase 后台的插件管理器进行安装和启用，或者使用 CLI 命令：

```bash
yarn nocobase plugin install @nocobase/plugin-enhanced-table-block
```

## 使用方法

1. 进入你需要添加表格的任意 NocoBase 页面。
2. 点击 **添加区块 (Add block)**，并在列表中选择 **增强表格 (Enhanced Table)**。
3. 配置该区块的数据源和数据表。
4. 在区块设置中启用 **合计行** 功能，系统会自动为你指定的列计算并展示聚合结果。
5. 在数据视图中，你可以通过鼠标拖拽选中多个包含数字的单元格，系统将自动汇总并在界面上向你展示求和结果。

## 协议

AGPL-3.0
