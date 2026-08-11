# @onetwosmall/plugin-system-enhancement

NocoBase（2.x，v2 运行时）系统增强插件：登录页自定义、Logo 链接导航、表格增强（汇总行、圈选统计、列宽拖拽）。

> 已放弃 v1 客户端运行时的支持，仅保留一个空 client 入口，使插件在 v1 应用中能被正常加载而不报错。

## 功能特性

### 登录页自定义

- 背景图片（支持 SVG、GIF、PNG、JPG、WebP）
- 表单位置（靠左 / 居中 / 靠右）及水平、垂直偏移
- 标题字体设置（字号、字重、字体颜色）
- 背景设置（尺寸、重复、位置）
- 实时预览与重置

### Logo 链接

- 点击左上角 Logo 跳转到自定义路径（如 `/admin`）
- 仅允许当前系统内的相对路径（服务端校验）

### 表格增强

汇总行与圈选统计通过覆盖注册 `TableBlockModel` 集成到**原生表格区块**（v2 flow 运行时），无需修改原表格区块代码。

- **汇总行**：按列聚合（求和 / 平均 / 计数 / 最小值 / 最大值），基于全部分页数据计算，以 sticky 页脚行展示
- **圈选统计**：在数字列上拖拽选中单元格范围，显示求和 / 最大值 / 最小值 / 平均值 / 计数
- **列宽拖拽**：拖动列头边框调整列宽

包裹逻辑（汇总行 + 圈选统计）仅在区块配置了汇总行后启用。

## 使用方式

在插件管理器中启用插件后：

1. **设置**：系统增强 → 表格增强 / 登录页自定义 / Logo 链接
2. **汇总行**：打开表格区块的设置流程 → "增强表格设置" → "汇总行设置"，为数字列选择聚合方式
3. **列宽调整**：拖动列头边框

## 兼容性

- 仅支持 NocoBase 2.x、v2（flow-engine）运行时
- 独立的"增强表格"区块（`use: 'EnhancedTableBlockModel'`）不再注册，使用过该区块的页面请改用原生表格区块重建

## 开发

```bash
# 运行单个测试文件
yarn test packages/plugins/@onetwosmall/plugin-system-enhancement/src/client-v2/enhanced-table/__tests__/computeSummary.test.ts

# 类型检查
yarn tsc -p tsconfig.json

# 代码规范
yarn eslint --fix packages/plugins/@onetwosmall/plugin-system-enhancement/src
```

## 更新历史

### v2.2.0-beta.17 (2026-08-11)

- 汇总行功能集成到原生表格区块：通过覆盖注册 `TableBlockModel`，所有原生表格区块（含存量页面）自动获得该功能
- 仅在配置了汇总行后启用包裹逻辑（汇总行渲染 + 圈选统计）
- 修复圈选统计浮层 `{{num}}` 未插值的问题（`useT` 现会透传 i18n options）
- 修复匿名用户无法加载登录页背景图片的问题（通过专用公开接口输出，校验图片类型并设置安全响应头：`X-Content-Type-Options: nosniff`，SVG 额外加 CSP `sandbox`；客户端从标量字段 `loginBackgroundImageId` 读取附件 id，附件本身保持私有）
- 放弃 v1 客户端支持，保留空 client 入口以避免 v1 运行时 RequireJS 加载报错
- 插件版本与 next 分支对齐（`2.2.0-beta.17`），并重新同步 `yarn.lock`
- 测试适配 next API（vitest 显式导入、`createModelOptions` 联合类型窄化）

### v2.2.0-beta.5 (2026-07-03 ~ 2026-08-10)

- 新增 `systemEnhancementSettings` 集合及设置持久化的 ACL 保护
- 新增登录页自定义
- 新增 Logo 链接导航（相对路径校验）
- 新增增强表格区块（汇总行 + 圈选统计，独立区块形态）

## 许可证

版权所有 © 2026 OneTwoSmall

本项目采用双许可：AGPL-3.0 与商业授权。
商业授权（如闭源部署）请联系：moonship1011@gmail.com。
