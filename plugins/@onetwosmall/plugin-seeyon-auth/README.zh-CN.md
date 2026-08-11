# @onetwosmall/plugin-seeyon-auth

NocoBase 致远OA（Seeyon OA）单点登录认证插件。

## 简介

该插件通过致远OA的第三方认证接口，实现致远OA账号到 NocoBase 的单点登录（SSO）。用户在 OA 系统完成认证后，插件校验 OA 票据（ticket）并自动登录 NocoBase，支持用户不存在时自动注册。

## 功能特性

- 基于 OA 票据校验的致远OA 单点登录认证
- 同时支持 v1（`/admin`）与 v2（`/v/admin`）两套客户端运行时
- 页面回调端点：校验票据后携带 JWT token 自动跳转
- JSON API 回调端点（`seeyonAuth:callback`）：供程序化认证使用
- 用户不存在时自动注册（可选）
- 可配置用户匹配字段（`username` / `email` / `nickname`）
- 认证器与 token 配置缓存，提升性能
- 安全加固：防路径穿越与开放重定向、回调页面防 XSS 注入

## 安装

安装后，在 NocoBase 插件管理页面启用该插件：

```bash
yarn nocobase pm enable @onetwosmall/plugin-seeyon-auth
```

## 配置说明

启用插件后，在 **设置 > 认证** 中新建认证器，类型选择「致远OA」，并配置以下选项：

| 选项 | 必填 | 说明 |
| --- | --- | --- |
| OA Host | 是 | 致远OA 服务器地址，例如 `http://127.0.0.1` |
| 用户不存在时自动注册 | 否 | 开启后，票据校验通过但用户不存在时，自动创建用户 |
| 用户匹配字段 | 否 | OA 用户与 NocoBase 用户的匹配字段：`username`（默认）、`email` 或 `nickname` |
| 默认密码 | 否 | 自动注册用户时使用的默认密码，需包含字母和数字且长度不少于 8 位，默认 `ABCabc@123` |

## 认证流程

1. 用户携带 OA 票据访问回调地址：
   - 页面回调：`/seeyon-auth/callback?v5ticket=<ticket>`（v1）或 `/v/seeyon-auth/callback?v5ticket=<ticket>`（v2）
   - 同时兼容 `ticket`、`token` 参数名
2. 插件调用 `{oaHost}/seeyon/thirdpartyController.do?ticket=<ticket>` 校验票据，响应体即为 OA 用户名
3. 按配置的匹配字段查找用户；若开启了自动注册且用户不存在，则自动创建
4. 校验成功后签发 NocoBase JWT token 并跳转（保留请求 URL 中的 `customPath` 作为跳转目标）；失败则跳转至登录页

### JSON API 回调

程序化认证可直接调用资源操作：

```bash
curl -X POST http://localhost:13000/api/seeyonAuth:callback \
  -H 'Content-Type: application/json' \
  -d '{"v5ticket": "<ticket>"}'
```

成功时返回 `{ token, user }`；失败时返回 `400` / `401` 错误，并附带机器可读的 `code`（`MISSING_TICKET`、`NO_AUTHENTICATOR`、`AUTH_FAILED`）。

## 安全说明

- 票据校验请求设置 5 秒超时，异常信息不会暴露给客户端
- 自定义跳转路径会校验路径穿越（`..`）并限制为安全字符，防止开放重定向
- 回调页面 HTML 对动态值进行转义，防止 XSS 注入
- `seeyonAuth:callback` 接口为 `public` 权限，请确保 `{oaHost}/seeyon/thirdpartyController.do` 接口仅对可信客户端开放

## 许可证

本项目采用双许可：AGPL-3.0 与商业授权。
商业授权（如闭源部署）请联系：moonship1011@gmail.com。
