/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import type { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { isSafeRelativeUrl } from './urlValidator';
// @ts-ignore
import pkg from '../../package.json';

export class PluginSystemEnhancementServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.settings`,
      actions: ['systemEnhancementSettings:*'],
    });

    this.app.acl.allow('systemEnhancementSettings', 'get', 'public');
    // 仅拥有系统内置“界面配置权限”（ui.* snippet）的角色可修改系统级设置
    this.app.acl.allowManager.registerAllowCondition('se.allowConfigure', async (ctx) => {
      const roleName = ctx.state.currentRole;
      if (!roleName) {
        return false;
      }
      const role = this.app.acl.getRole(roleName);
      if (!role) {
        return false;
      }
      const { allowed } = role.effectiveSnippets();
      return allowed.some((name) => name.startsWith('ui.'));
    });
    this.app.acl.allow('systemEnhancementSettings', 'update', 'se.allowConfigure');

    // 登录页为匿名访问：背景图片通过专用公开接口输出（仅当前配置的那一个附件，且必须是图片），
    // 附件本身仍受 file-manager 的 ACL 保护；响应统一设置 nosniff 等安全头，SVG 额外加 CSP sandbox。
    this.app.acl.allow('systemEnhancementSettings', 'getLoginBackgroundImage', 'public');
    this.app.resourcer.registerActionHandler('systemEnhancementSettings:getLoginBackgroundImage', async (ctx, next) => {
      const settings = await this.db.getRepository('systemEnhancementSettings').findOne({
        filter: { id: 1 },
        appends: ['loginBackgroundImage'],
      });
      const attachment = settings?.get('loginBackgroundImage');
      if (!attachment || attachment.get('storageId') == null) {
        return ctx.throw(404);
      }
      const mimetype = attachment.get('mimetype');
      if (typeof mimetype !== 'string' || !mimetype.startsWith('image/')) {
        return ctx.throw(404);
      }
      const fileManager = this.app.pm.get<PluginFileManagerServer>('file-manager');
      let stream;
      let contentType;
      try {
        const result = await fileManager.getFileStream(attachment);
        stream = result.stream;
        contentType = result.contentType;
      } catch (error) {
        ctx.logger?.warn?.('Failed to stream the login background image', { error });
        return ctx.throw(404);
      }
      ctx.type = contentType || mimetype;
      ctx.set('X-Content-Type-Options', 'nosniff');
      ctx.set('Cache-Control', 'public, max-age=3600');
      if (mimetype === 'image/svg+xml') {
        ctx.set('Content-Security-Policy', 'sandbox');
      }
      ctx.body = stream;
      await next();
    });

    this.app.db.on('systemEnhancementSettings.beforeCreate', (model) => {
      this.assertLogoLinkUrlSafe(model);
    });
    this.app.db.on('systemEnhancementSettings.beforeUpdate', (model) => {
      this.assertLogoLinkUrlSafe(model);
    });
  }

  assertLogoLinkUrlSafe(model: any) {
    if (!model.changed('logoLinkUrl') || isSafeRelativeUrl(model.get('logoLinkUrl'))) {
      return;
    }
    throw new Error(
      this.app.i18n.t('Only relative paths within the current system are allowed for the logo link', {
        ns: pkg.name,
      }),
    );
  }

  async load() {}

  async install() {}

  async afterEnable() {
    try {
      const repo = this.db.getRepository('systemEnhancementSettings');
      const count = await repo.count();
      if (count === 0) {
        await repo.create({
          values: {
            id: 1,
            enableTableColumnResize: true,
            loginFormPosition: 'center',
            loginFormOffsetX: 0,
            loginFormOffsetY: 0,
            loginBackgroundSize: 'cover',
            loginBackgroundRepeat: 'no-repeat',
            loginBackgroundPosition: 'center',
            logoLinkUrl: '',
            enableEnhancedTable: true,
          },
        });
      }
    } catch {
      // Non-critical
    }
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginSystemEnhancementServer;
