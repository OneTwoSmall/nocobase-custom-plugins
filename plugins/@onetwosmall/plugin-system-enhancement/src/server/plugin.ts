/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginSystemEnhancementServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.settings`,
      actions: ['systemEnhancementSettings:*'],
    });

    this.app.acl.allow('systemEnhancementSettings', ['get', 'update'], 'loggedIn');
  }

  async load() {}

  async install() {}

  async afterEnable() {
    try {
      const repo = this.db.getRepository('systemEnhancementSettings');
      const count = await repo.count();
      if (count === 0) {
        await repo.create({ values: { id: 1, enableTableColumnResize: true } });
      }
    } catch {
      // Non-critical
    }
  }

  async afterDisable() {}

  async remove() {}
}

export default PluginSystemEnhancementServer;
