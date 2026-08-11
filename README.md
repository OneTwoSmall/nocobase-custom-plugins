# NocoBase Custom Plugins | NocoBase 自研插件集

<p align="center">
  <a href="#chinese">简体中文</a> | <a href="#english">English</a>
</p>

---

<div id="chinese"></div>

## 🇨🇳 简体中文

欢迎来到 **OneTwoSmall** 的 NocoBase 插件仓库。本仓库致力于提供高质量的自定义插件，增强 NocoBase 在复杂业务场景下的表现。

### 📦 插件列表

| 插件名称 | 目录名 | 说明 | 状态 |
| :--- | :--- | :--- | :--- |
| **增强版表格区块** | `plugins/@nocobase/plugin-enhanced-table-block` | 增强表格区块，支持合计行和圈选求和功能。功能已迁移至系统增强插件。 | ❌ 已废弃 |
| **Office 文件预览插件** | `plugins/@nocobase/plugin-file-previewer-office` | 支持多种办公文件预览，提供可配置的预览选项。 | ❌ 已废弃 |
| **文件预览增强插件** | `plugins/@onetwosmall/plugin-file-previewer-pro` | 增强版文件预览插件，支持更多格式、调用本地预览服务和更丰富的配置选项，替代原 Office 文件预览插件。 | ✅ 已发布 |
| **邮件身份认证插件** | `plugins/@nocobase/plugin-auth-email` | 提供安全可靠的邮件验证码登录与注册功能。 | ❌ 已废弃 |
| **邮件身份认证插件 V2** | `plugins/@onetwosmall/plugin-auth-email` | 基于原插件重构，新增 V2-Client 支持、邮件 HTML 模板及模板实时预览功能，替代原邮件身份认证插件。 | ✅ 已发布 |
| **致远OA单点登录插件** | `plugins/@onetwosmall/plugin-seeyon-auth` | 通过致远OA第三方认证接口实现单点登录（SSO），支持票据校验、自动注册与 v1/v2 客户端。 | ✅ 已发布 |
| **系统增强插件** | `plugins/@onetwosmall/plugin-system-enhancement` | 系统增强功能：原生表格汇总行与圈选统计、列宽拖拽调整、登录页自定义（背景图、表单位置、标题样式）与 Logo 链接导航。已替代原增强版表格区块插件。 | ✅ 已发布 |
| **更多插件...** | - | 持续开发中，敬请期待。 | 🛠️ 计划中 |

### 🚀 快速安装

1. **克隆本仓库**：
   ```bash
   git clone [https://github.com/OneTwoSmall/nocobase-custom-plugins.git](https://github.com/OneTwoSmall/nocobase-custom-plugins.git)
   ```

2. **源码放入 nocobase 插件存放目录**：
   ```bash
   cd your-nocobase-project/packages/plugins/@nocobase
   ```

3. **启用并编译**（以增强表格插件为例）：
   ```bash
   # 启用插件
   yarn nocobase pm enable @nocobase/plugin-enhanced-table-block
   
   # 全量编译项目
   yarn build
   
   # 编译插件
   yarn nocobase build @nocobase/plugin-enhanced-table-block

   # 打包插件 打包后路径 /storage/tar/
   yarn nocobase build @nocobase/plugin-enhanced-table-block --tar
   
   # 重启服务
   yarn nocobase start
   ```

### 💼 商业定制与支持
暂无.

---

<div id="english"></div>

## 🇺🇸 English

Welcome to **OneTwoSmall's** NocoBase plugin repository. This collection features high-quality custom plugins designed to extend and enhance the NocoBase platform.

### 📦 Plugin List

| Plugin Name | Directory | Description | Status |
| :--- | :--- | :--- | :--- |
| **Enhanced Table Block** | `plugins/@nocobase/plugin-enhanced-table-block` | Enhanced table block, supporting total rows and selection-sum functions. Functionality has migrated to the System Enhancement plugin. | ❌ Deprecated |
| **Office File Previewer** | `plugins/@nocobase/plugin-file-previewer-office` | Supports various office file previews with configurable options. | ❌ Deprecated |
| **File Previewer Pro** | `plugins/@onetwosmall/plugin-file-previewer-pro` | Enhanced file preview plugin with support for more formats, call local preview service, and richer configuration options. Replaces the Office File Previewer plugin. | ✅ Active |
| **Email Auth Plugin** | `plugins/@nocobase/plugin-auth-email` | Provides secure and reliable email verification code login/registration. | ❌ Deprecated |
| **Email Auth Plugin V2** | `plugins/@onetwosmall/plugin-auth-email` | Refactored from the original plugin with added V2-Client support, email HTML templates, and live template preview. Replaces the original Email Auth Plugin. | ✅ Active |
| **Seeyon OA Auth Plugin** | `plugins/@onetwosmall/plugin-seeyon-auth` | Single sign-on authentication against Seeyon OA via ticket validation, with auto-registration and v1/v2 client support. | ✅ Active |
| **System Enhancement Plugin** | `plugins/@onetwosmall/plugin-system-enhancement` | System enhancements: native table summary rows with cell selection stats, resizable table columns, customizable login page (background image, form position, title styles), and logo link navigation. Replaces the Enhanced Table Block plugin. | ✅ Active |
| **More...** | - | More plugins are on the way. | 🛠️ Roadmap |

### 🚀 Quick Start

1. **Clone this repository**:
   ```bash
   git clone [https://github.com/OneTwoSmall/nocobase-custom-plugins.git](https://github.com/OneTwoSmall/nocobase-custom-plugins.git)
   ```

2. **Move source code to the NocoBase plugin directory**:
   ```bash
   cd your-nocobase-project/packages/plugins/@nocobase
   ```

3. **Enable and Build** (Example for Enhanced Table Block):
   ```bash
   # Enable the plugin
   yarn nocobase pm enable @nocobase/plugin-enhanced-table-block
   
   # Build the entire project
   yarn build
   
   # Build the specific plugin
   yarn nocobase build @nocobase/plugin-enhanced-table-block

   # Tar package into path: /storage/tar/
   yarn nocobase build @nocobase/plugin-enhanced-table-block --tar
   
   # Restart NocoBase
   yarn nocobase start
   ```

### 💼 Commercial Support
Not Now.

---

## ☕ 捐赠与支持 / Donation

如果你觉得这些插件对你有帮助，欢迎请我喝杯咖啡。你的支持是我持续更新的动力！

If these plugins have helped you, feel free to buy me a coffee. Your support is greatly appreciated!

| 微信支付 / WeChat Pay | 支付宝 / Alipay |
| :---: | :---: |
| <img src="./assets/wechat-pay.png" width="220" alt="WeChat Pay"> | <img src="./assets/alipay.png" width="220" alt="Alipay"> |

---
<p align="center">
  <b>OneTwoSmall</b> · Built with ❤️ for the NocoBase Community
</p>
