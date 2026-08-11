/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { authType, namespace } from '../constants';
import { SeeyonAuth } from './seeyon-auth';
import { tval } from '@nocobase/utils';
import { resolvePassword } from './utils';

export class PluginSeeyonAuthServer extends Plugin {
  private cachedAuthenticator: any = null;
  private cachedTokenConfig: any = null;

  async load() {
    this.db.on('authenticators.afterSave', () => {
      this.cachedAuthenticator = null;
    });
    this.db.on('authenticators.afterDestroy', () => {
      this.cachedAuthenticator = null;
    });
    this.db.on('tokenControlConfig.afterSave', () => {
      this.cachedTokenConfig = null;
    });

    this.app.authManager.registerTypes(authType, {
      auth: SeeyonAuth,
      title: tval('Seeyon OA', { ns: namespace }),
    });

    this.app.use(
      async (ctx, next) => {
        const parsed = parseCallbackPath(ctx.path);
        if (!parsed) return next();

        this.app.logger.info(`[seeyon-auth] callback path=${ctx.path} query=${ctx.request.querystring}`);

        const { appPrefix, isV2, customPath } = parsed;
        const base = `${appPrefix}${isV2 ? '/v/admin' : '/admin'}`;
        const rawTicket = (ctx.query.v5ticket || ctx.query.ticket || ctx.query.token) as string | undefined;
        const v5ticket = typeof rawTicket === 'string' ? rawTicket : undefined;

        let token: string | null = null;

        if (v5ticket) {
          const authenticator = await this.getCachedAuthenticator();
          if (authenticator) {
            const result = await this.validateTicketAndLogin(authenticator, v5ticket);
            if (result) token = result.token;
          }
        }

        ctx.type = 'text/html';
        ctx.body = renderCallbackHTML({ base, customPath, token });
      },
      { tag: 'seeyon-auth-callback', after: 'bodyParser', before: 'dataSource' },
    );

    this.app.resourceManager.define({
      name: 'seeyonAuth',
      actions: {
        callback: async (ctx, next) => {
          const { v5ticket } = ctx.action.params.values || {};
          this.app.logger.info(`[seeyon-auth] API callback values=${JSON.stringify(ctx.action.params.values || {})}`);
          if (!v5ticket) {
            ctx.throw(400, { message: 'ticket or v5ticket is required', code: 'MISSING_TICKET' });
            return;
          }
          const authenticator = await this.getCachedAuthenticator();
          if (!authenticator) {
            ctx.throw(400, { message: 'Seeyon authenticator not found or disabled', code: 'NO_AUTHENTICATOR' });
            return;
          }
          const result = await this.validateTicketAndLogin(authenticator, v5ticket);
          if (!result) {
            const options = authenticator.options?.public || {};
            const autoRegister = options.autoRegister;
            ctx.throw(401, {
              message: autoRegister
                ? 'OA ticket validation failed or user auto-creation error'
                : 'OA ticket validation failed or user not found (auto-registration disabled)',
              code: 'AUTH_FAILED',
            });
            return;
          }
          ctx.body = { token: result.token, user: result.user };
          await next();
        },
      },
    });

    this.app.acl.allow('seeyonAuth', 'callback', 'public');
  }

  async getCachedAuthenticator() {
    if (this.cachedAuthenticator) return this.cachedAuthenticator;
    const repo = this.db.getRepository('authenticators');
    this.cachedAuthenticator = await repo.findOne({ filter: { authType, enabled: true } });
    return this.cachedAuthenticator;
  }

  async validateTicketAndLogin(authenticator: any, v5ticket: string) {
    const options = authenticator.options?.public || {};
    const oaHost = options.oaHost;
    if (!oaHost) return null;
    if (!this.cachedTokenConfig) {
      this.cachedTokenConfig = await this.app.authManager.tokenController.getConfig();
    }
    const username = await this.validateOATicket(oaHost, v5ticket);
    if (!username) return null;
    const matchField = options.matchField || 'username';
    const autoRegister = options.autoRegister;
    const userRepo = this.db.getRepository('users');
    let user = await userRepo.findOne({ filter: { [matchField]: username } });
    if (!user && autoRegister) {
      this.app.logger.info(`[seeyon-auth] auto-registering user: ${username} (${matchField})`);
      user = await userRepo.create({
        values: { [matchField]: username, nickname: username, password: resolvePassword(options.defaultPassword) },
      });
    }
    if (!user) {
      this.app.logger.warn(`[seeyon-auth] user not found: ${username}, autoRegister=${autoRegister}`);
      return null;
    }
    const [_, tokenInfo] = await Promise.all([
      authenticator.addUser(user, { through: { uuid: username } }).catch(() => {}),
      this.app.authManager.tokenController.add({ userId: user.id, authenticator: authenticator.name }),
    ]);
    const token = this.app.authManager.jwt.sign(
      { userId: user.id, temp: true, iat: Math.floor(tokenInfo.issuedTime / 1000), signInTime: tokenInfo.signInTime },
      { jwtid: tokenInfo.jti, expiresIn: Math.floor(this.cachedTokenConfig.tokenExpirationTime / 1000) },
    );
    return { token, user };
  }

  async validateOATicket(oaHost: string, v5ticket: string): Promise<string | null> {
    const url = `${oaHost}/seeyon/thirdpartyController.do?ticket=${encodeURIComponent(v5ticket)}`;
    this.app.logger.info(`[seeyon-auth] validating ticket at ${oaHost}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        this.app.logger.warn(`[seeyon-auth] OA responded ${response.status}`);
        return null;
      }
      const text = await response.text();
      if (!text) {
        this.app.logger.warn(`[seeyon-auth] OA returned empty body`);
        return null;
      }
      if (text.toLowerCase().includes('error')) {
        this.app.logger.warn(`[seeyon-auth] OA returned error: ${text}`);
        return null;
      }
      this.app.logger.info(`[seeyon-auth] ticket validated, username: ${text.trim()}`);
      return text.trim();
    } catch (err: any) {
      this.app.logger.error(`[seeyon-auth] OA fetch failed: ${err.message || err}`);
      return null;
    }
  }
}

export default PluginSeeyonAuthServer;

function parseCallbackPath(path: string) {
  const suffixes = ['/v/seeyon-auth/callback', '/seeyon-auth/callback'];
  for (const suffix of suffixes) {
    const idx = path.indexOf(suffix);
    if (idx === -1) continue;
    const after = path.substring(idx + suffix.length);
    if (after !== '' && !after.startsWith('/')) continue;
    let customPath = after.startsWith('/') ? after.substring(1) : after;
    if (/\.\.(\\|\/)/.test(customPath) || /\.\.$/.test(customPath)) {
      customPath = '';
    }
    return {
      appPrefix: path.substring(0, idx),
      isV2: suffix.startsWith('/v/'),
      customPath,
    };
  }
  return null;
}

function renderCallbackHTML(opts: { base: string; customPath: string; token: string | null }) {
  const { base, token } = opts;
  const safePath = /^[a-zA-Z0-9_\-/.]+$/.test(opts.customPath) ? opts.customPath : '';
  const homeUrl = `${base}/`;
  const signinUrl = `${base}/signin?error=invalid_ticket`;
  const targetUrl = token
    ? safePath
      ? `${base}/${safePath}?token=${encodeURIComponent(token)}`
      : `${base}/?token=${encodeURIComponent(token)}`
    : signinUrl;
  const title = token ? '验证成功 - 致远OA 单点登录' : '认证失败 - 致远OA 单点登录';
  const icon = token ? '&#9989;' : '&#9888;&#65039;';
  const heading = token ? '验证成功' : '认证失败';
  const subtitle = token ? '正在跳转到目标页面...' : 'OA 单点登录验证未通过，请重新尝试';
  const spinColor = token ? ['#52c41a', '#389e0d'] : [];
  const hint = token ? '即将跳转' : '';
  const timerJs = token
    ? `
  var D=800;setTimeout(function(){
    document.getElementById('s').classList.remove('hidden');
    setTimeout(function(){location.replace('${targetUrl}');},200);
  },D);
  `
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
.w{display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}
.c{background:#fff;border-radius:12px;padding:48px 56px;box-shadow:0 16px 48px rgba(0,0,0,.12);text-align:center;max-width:400px;width:90%}
.ic{font-size:44px;margin-bottom:12px}
.t{font-size:20px;font-weight:600;color:#1a1a2e;margin-bottom:6px}
.s{font-size:14px;color:#888;margin-bottom:28px}
.sp{display:flex;justify-content:center;margin-bottom:20px}
.h{font-size:12px;color:#bbb}
.ph{color:#999;font-size:12px;margin-top:24px}
svg circle.track{fill:none;stroke:#eee;stroke-width:3}
svg circle.arc{fill:none;stroke-width:3;stroke-linecap:round;stroke-dasharray:90;stroke-dashoffset:70;transform-origin:22px 22px;animation:spin .9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.btn{display:flex;flex-direction:column;gap:12px}
.btn button{border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:500;width:100%;padding:10px 0}
.btn .b1{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff}
.btn .b2{background:transparent;color:#888;border:1px solid #ddd}
.hidden{display:none !important}
</style>
</head>
<body>
<div class="w">
  <div class="c">
    <div id="l" class="${token ? 'hidden' : ''}">
      <div class="ic">&#128274;</div>
      <div class="t">致远OA 单点登录</div>
      <div class="s">正在验证您的身份信息...</div>
      <div class="sp"><svg width="44" height="44" viewBox="0 0 44 44"><circle class="track" cx="22" cy="22" r="18"/><circle class="arc" cx="22" cy="22" r="18" stroke="url(#g1)"/><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#667eea"/><stop offset="1" stop-color="#764ba2"/></linearGradient></defs></svg></div>
      <div class="h">请稍候</div>
    </div>
    <div id="s" class="${token ? '' : 'hidden'}">
      <div class="ic">${icon}</div>
      <div class="t">${heading}</div>
      <div class="s">${subtitle}</div>
      ${
        spinColor.length
          ? `<div class="sp"><svg width="44" height="44" viewBox="0 0 44 44"><circle class="track" cx="22" cy="22" r="18"/><circle class="arc" cx="22" cy="22" r="18" stroke="url(#g2)"/><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${spinColor[0]}"/><stop offset="1" stop-color="${spinColor[1]}"/></linearGradient></defs></svg></div>`
          : ''
      }
      <div class="h">${hint}</div>
      ${
        token
          ? ''
          : `<div class="btn" style="margin-top:12px"><button class="b1" onclick="location.reload()">重新尝试</button><button class="b2" onclick="location.replace('${homeUrl}')">返回首页</button></div>`
      }
    </div>
    <div class="ph">Powered by NocoBase</div>
  </div>
</div>
<script>
  ${timerJs}
</script>
</body>
</html>`;
}
