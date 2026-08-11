/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import type { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { createMockServer, type MockServer } from '@nocobase/test';
import { isSafeRelativeUrl } from '../urlValidator';

async function createMockApp(): Promise<MockServer> {
  const app = await createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'error-handler',
      'field-sort',
      'users',
      'auth',
      'acl',
      'ui-schema-storage',
      'data-source-main',
      'data-source-manager',
      'system-settings',
      'file-manager',
      '@onetwosmall/plugin-system-enhancement',
    ],
  });
  const repo = app.db.getRepository('systemEnhancementSettings');
  if ((await repo.count()) === 0) {
    await repo.create({
      values: {
        id: 1,
        logoLinkUrl: '',
      },
    });
  }
  return app;
}

describe('isSafeRelativeUrl', () => {
  it('should allow safe relative paths', () => {
    expect(isSafeRelativeUrl('')).toBe(true);
    expect(isSafeRelativeUrl('   ')).toBe(true);
    expect(isSafeRelativeUrl('/')).toBe(true);
    expect(isSafeRelativeUrl('/admin')).toBe(true);
    expect(isSafeRelativeUrl('admin/users')).toBe(true);
    expect(isSafeRelativeUrl('/pages/home?tab=1')).toBe(true);
    expect(isSafeRelativeUrl('#/detail')).toBe(true);
    expect(isSafeRelativeUrl(undefined)).toBe(true);
    expect(isSafeRelativeUrl(123)).toBe(true);
  });

  it('should reject absolute urls and schemes', () => {
    expect(isSafeRelativeUrl('https://evil.com')).toBe(false);
    expect(isSafeRelativeUrl('http://evil.com/x')).toBe(false);
    expect(isSafeRelativeUrl('//evil.com')).toBe(false);
    expect(isSafeRelativeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeRelativeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeRelativeUrl('mailto:a@b.com')).toBe(false);
    expect(isSafeRelativeUrl('vbscript:msgbox(1)')).toBe(false);
  });

  it('should reject obfuscated schemes and control chars', () => {
    expect(isSafeRelativeUrl('jav\tascript:alert(1)')).toBe(false);
    expect(isSafeRelativeUrl('java\nscript:alert(1)')).toBe(false);
    expect(isSafeRelativeUrl('  javascript:alert(1)')).toBe(false);
    expect(isSafeRelativeUrl('java\\script:alert(1)')).toBe(false);
    expect(isSafeRelativeUrl('/admin\b')).toBe(false);
  });
});

describe('systemEnhancementSettings security', () => {
  let app: MockServer;

  afterEach(async () => {
    await app.destroy();
  });

  it('should allow anonymous GET', async () => {
    app = await createMockApp();
    const response = await app.agent().resource('systemEnhancementSettings').get({ filterByTk: 1 });
    expect(response.status).toBe(200);
  });

  it('should reject update without ui.* configure permission', async () => {
    app = await createMockApp();
    await app.db.getRepository('roles').create({ values: { name: 'plain-user' } });
    const user = await app.db.getRepository('users').create({ values: { roles: ['plain-user'] } });
    const agent = await app.agent().login(user);

    const response = await agent.resource('systemEnhancementSettings').update({
      filterByTk: 1,
      values: { logoLinkUrl: '/admin' },
    });
    expect(response.status).toBe(403);
  });

  it('should reject update with pm snippet but without ui.* permission', async () => {
    app = await createMockApp();
    await app.db.getRepository('roles').create({
      values: { name: 'pm-only', snippets: ['pm.system-enhancement.settings'] },
    });
    const user = await app.db.getRepository('users').create({ values: { roles: ['pm-only'] } });
    const agent = await app.agent().login(user);

    const response = await agent.resource('systemEnhancementSettings').update({
      filterByTk: 1,
      values: { logoLinkUrl: '/admin' },
    });
    expect(response.status).toBe(403);
  });

  it('should allow update for roles with ui.* permission', async () => {
    app = await createMockApp();
    await app.db.getRepository('roles').create({ values: { name: 'ui-configure', snippets: ['ui.*'] } });
    const user = await app.db.getRepository('users').create({ values: { roles: ['ui-configure'] } });
    const agent = await app.agent().login(user);

    const response = await agent.resource('systemEnhancementSettings').update({
      filterByTk: 1,
      values: { logoLinkUrl: '/admin' },
    });
    expect(response.status).toBe(200);

    const record = await app.db.getRepository('systemEnhancementSettings').findOne({ filterByTk: 1 });
    expect(record.get('logoLinkUrl')).toBe('/admin');
  });

  it('should reject unsafe logo link url on update', async () => {
    app = await createMockApp();
    await app.db.getRepository('roles').create({ values: { name: 'ui-configure', snippets: ['ui.*'] } });
    const user = await app.db.getRepository('users').create({ values: { roles: ['ui-configure'] } });
    const agent = await app.agent().login(user);

    for (const url of ['javascript:alert(1)', '//evil.com', 'jav\tascript:alert(1)', '\\evil.com']) {
      const response = await agent.resource('systemEnhancementSettings').update({
        filterByTk: 1,
        values: { logoLinkUrl: url },
      });
      expect(response.status).not.toBe(200);

      const record = await app.db.getRepository('systemEnhancementSettings').findOne({ filterByTk: 1 });
      expect(record.get('logoLinkUrl')).not.toBe(url);
    }
  });

  it('should serve the login background image anonymously with safe headers only for image attachments', async () => {
    app = await createMockApp();
    const fileManager = app.pm.get<PluginFileManagerServer>('file-manager');
    const getFileStreamSpy = vi.spyOn(fileManager, 'getFileStream');

    const agent = app.agent();

    // 未配置背景图 -> 404
    let response = await agent.resource('systemEnhancementSettings').getLoginBackgroundImage();
    expect(response.status).toBe(404);

    const settings = await app.db.getRepository('systemEnhancementSettings').findOne({ filterByTk: 1 });
    const createAttachment = (filename: string, mimetype: string, extname: string) =>
      app.db.getRepository('attachments').create({
        values: { storageId: 1, filename, extname, mimetype, path: filename, url: filename, size: 1 },
      });

    // 非图片附件 -> 404
    const textAttachment = await createAttachment('a.txt', 'text/plain', '.txt');
    settings.set('loginBackgroundImageId', textAttachment.get('id'));
    await settings.save();
    response = await agent.resource('systemEnhancementSettings').getLoginBackgroundImage();
    expect(response.status).toBe(404);
    expect(getFileStreamSpy).not.toHaveBeenCalled();

    // 图片附件 -> 200 + nosniff
    getFileStreamSpy.mockResolvedValue({ stream: Readable.from(['fake-image']), contentType: 'image/png' });
    const imageAttachment = await createAttachment('bg.png', 'image/png', '.png');
    settings.set('loginBackgroundImageId', imageAttachment.get('id'));
    await settings.save();
    response = await agent.resource('systemEnhancementSettings').getLoginBackgroundImage();
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('image/png');
    expect(response.headers['x-content-type-options']).toBe('nosniff');

    // SVG 附件 -> 200 + CSP sandbox 防脚本执行
    getFileStreamSpy.mockResolvedValue({ stream: Readable.from(['<svg></svg>']), contentType: 'image/svg+xml' });
    const svgAttachment = await createAttachment('bg.svg', 'image/svg+xml', '.svg');
    settings.set('loginBackgroundImageId', svgAttachment.get('id'));
    await settings.save();
    response = await agent.resource('systemEnhancementSettings').getLoginBackgroundImage();
    expect(response.status).toBe(200);
    expect(response.headers['content-security-policy']).toBe('sandbox');
  });
});
