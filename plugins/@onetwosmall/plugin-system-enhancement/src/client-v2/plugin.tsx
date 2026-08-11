/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { Plugin } from '@nocobase/client-v2';
import React from 'react';
import { NAMESPACE } from './constants';
import { ResizableHeader } from './ResizableHeader';
import { applyStyles, type LoginPageStyleSettings } from './loginPageStyleInjector';

let enableTableColumnResize = true;

export function setTableColumnResizeEnabled(enabled: boolean) {
  enableTableColumnResize = enabled;
}

export class PluginSystemEnhancementClientV2 extends Plugin<any> {
  async load() {
    const self = this as any;

    self.pluginSettingsManager.addMenuItem({
      key: NAMESPACE,
      title: this.t('System Enhancement'),
      icon: 'ToolOutlined',
    });
    self.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'index',
      title: this.t('Table Enhancement'),
      aclSnippet: `pm.${NAMESPACE}.settings`,
      componentLoader: () => import('./pages/TableEnhancementSettings'),
    });
    self.pluginSettingsManager.addPageTabItem({
      menuKey: NAMESPACE,
      key: 'login-page',
      title: this.t('Login Page Customization'),
      aclSnippet: `pm.${NAMESPACE}.settings`,
      componentLoader: () => import('./pages/LoginPageSettings'),
    });

    try {
      const res = await self.context.api.request({
        url: 'systemEnhancementSettings:get/1',
        method: 'get',
        params: { appends: ['loginBackgroundImage'] },
      });
      const data = res?.data?.data;
      enableTableColumnResize = data?.enableTableColumnResize !== false;
      if (data) {
        applyStyles(data as LoginPageStyleSettings);
      }
    } catch {
      /* default */
    }

    const { TableColumnModel } = await import('@nocobase/client-v2');
    this.patchTableColumnModel(TableColumnModel);
    this.patchSubTableColumnModel();
  }

  patchTableColumnModel(TableColumnModel: any) {
    const original = TableColumnModel.prototype.getColumnProps;
    TableColumnModel.prototype.getColumnProps = function () {
      if (!enableTableColumnResize) return original.call(this);
      try {
        const props = original.call(this);
        if (!props || !props.title) return props;
        const flowKey = (this.context as any)?.flowSettingsEnabled ? 'tableColumnSettings' : undefined;
        return {
          ...props,
          title: (
            <ResizableHeader model={this} width={(this as any).props?.width} persistFlowKey={flowKey}>
              {props.title}
            </ResizableHeader>
          ),
        };
      } catch {
        return original.call(this);
      }
    };
  }

  async patchSubTableColumnModel() {
    try {
      const { SubTableColumnModel } = await import('@nocobase/client-v2');
      if (!SubTableColumnModel?.prototype?.getColumnProps) return;
      const original = SubTableColumnModel.prototype.getColumnProps;
      SubTableColumnModel.prototype.getColumnProps = function () {
        if (!enableTableColumnResize) return original.call(this);
        try {
          const props = original.call(this);
          if (!props || !props.title) return props;
          const flowKey = (this.context as any)?.flowSettingsEnabled ? 'subTableColumnSettings' : undefined;
          return {
            ...props,
            title: (
              <ResizableHeader model={this} width={(this as any).props?.width} persistFlowKey={flowKey}>
                {props.title}
              </ResizableHeader>
            ),
          };
        } catch {
          return original.call(this);
        }
      };
    } catch {
      /* not available */
    }
  }
}

export default PluginSystemEnhancementClientV2;
