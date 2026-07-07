/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import TableEnhancementSettings from './pages/TableEnhancementSettings';
import { NAMESPACE } from './constants';

export class PluginSystemEnhancementClient extends Plugin {
  declare app: any;
  declare t: any;

  async load() {
    this.app.pluginSettingsManager.add(`${NAMESPACE}`, {
      title: this.t('System Enhancement'),
      icon: 'ToolOutlined',
      Component: TableEnhancementSettings,
      aclSnippet: `pm.${NAMESPACE}.settings`,
    });
  }
}

export default PluginSystemEnhancementClient;
