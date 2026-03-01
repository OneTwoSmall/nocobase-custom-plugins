/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useCollectionManager_deprecated, useDesignable } from '@nocobase/client';
import { EnhancedTableBlockModel, EnhancedTableWrapper } from './EnhancedTableBlockModel';
import { EnhancedTableBlockInitializer } from './EnhancedTableBlockInitializer';
import { observer, useFieldSchema, useField } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import enUS from '../locale/en-US.json';
import zhCN from '../locale/zh-CN.json';

const EnhancedTableV1Wrapper = observer((props: any) => {
  return <EnhancedTableWrapper>{props.children}</EnhancedTableWrapper>;
});

export class PluginEnhancedTableBlockClient extends Plugin {
  async load() {
    this.app.i18n.addResources('zh-CN', '@nocobase/plugin-enhanced-table-block/client', zhCN);
    this.app.i18n.addResources('en-US', '@nocobase/plugin-enhanced-table-block/client', enUS);

    this.flowEngine.registerModels({
      EnhancedTableBlockModel,
    });

    this.app.addComponents({
      EnhancedTableV1Wrapper,
      EnhancedTableBlockInitializer,
    });

    // Add V1 schema initializer item for Enhanced Table
    this.app.schemaInitializerManager.addItem('page:addBlock', 'dataBlocks.enhancedTable', {
      title: '{{t("Enhanced Table", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}',
      Component: 'EnhancedTableBlockInitializer',
    });

    this.app.schemaInitializerManager.addItem('RecordBlockInitializers', 'dataBlocks.enhancedTable', {
      title: '{{t("Enhanced Table", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}',
      Component: 'EnhancedTableBlockInitializer',
    });

    // Add V1 schema settings
    this.app.schemaSettingsManager.addItem('blockSettings:table', 'summaryConfig', {
      type: 'modal',
      useVisible() {
        const fieldSchema = useFieldSchema();
        // Check if TableV2 has EnhancedTableV1Wrapper
        return Object.values(fieldSchema?.properties || {}).some(
          (prop: any) => prop['x-component'] === 'TableV2' && prop['x-decorator'] === 'EnhancedTableV1Wrapper',
        );
      },
      useComponentProps() {
        const { t } = useTranslation(['@nocobase/plugin-enhanced-table-block/client', 'client'], {
          nsMode: 'fallback',
        });
        const fieldSchema = useFieldSchema();
        const { getCollection } = useCollectionManager_deprecated();
        const { dn } = useDesignable();

        const tableSchema = Object.values(fieldSchema.properties || {}).find(
          (prop: any) => prop['x-component'] === 'TableV2',
        ) as any;

        // Find collection name
        const collectionName =
          fieldSchema?.['x-decorator-props']?.collection ||
          fieldSchema?.['x-decorator-props']?.association?.split('.')[0];
        const collection = getCollection(collectionName);

        const currentConfig = tableSchema?.['x-decorator-props']?.summaryConfig || {};

        return {
          title: t('Summary row settings', {
            ns: '@nocobase/plugin-enhanced-table-block/client',
          }),
          schema: () => {
            const columnsToSelect: { label: string; value: string; disabled?: boolean }[] = [];
            if (collection) {
              collection.fields?.forEach((collectionField) => {
                const isNumeric =
                  ['integer', 'bigInt', 'float', 'double', 'decimal', 'number'].includes(collectionField.type) ||
                  ['number', 'integer', 'percent', 'currency'].includes(collectionField.interface);

                if (isNumeric) {
                  columnsToSelect.push({
                    label: collectionField.uiSchema?.title || collectionField.title || collectionField.name,
                    value: collectionField.name,
                  });
                }
              });
            }

            return {
              type: 'object',
              properties: {
                summaryConfig: {
                  type: 'object',
                  'x-decorator': 'FormItem',
                  'x-component': 'div',
                  default: currentConfig,
                  properties: columnsToSelect.reduce(
                    (acc, col) => {
                      acc[col.value] = {
                        type: 'string',
                        title: col.label,
                        'x-decorator': 'FormItem',
                        'x-component': 'Select',
                        'x-component-props': {
                          allowClear: true,
                          options: [
                            {
                              label: t('Sum', {
                                ns: '@nocobase/plugin-enhanced-table-block/client',
                              }),
                              value: 'sum',
                            },
                            {
                              label: t('Average', {
                                ns: '@nocobase/plugin-enhanced-table-block/client',
                              }),
                              value: 'avg',
                            },
                            {
                              label: t('Count', {
                                ns: '@nocobase/plugin-enhanced-table-block/client',
                              }),
                              value: 'count',
                            },
                            {
                              label: t('Min', {
                                ns: '@nocobase/plugin-enhanced-table-block/client',
                              }),
                              value: 'min',
                            },
                            {
                              label: t('Max', {
                                ns: '@nocobase/plugin-enhanced-table-block/client',
                              }),
                              value: 'max',
                            },
                          ],
                          disabled: col.disabled,
                        },
                      };
                      return acc;
                    },
                    {} as Record<string, any>,
                  ),
                },
              },
            };
          },
          onSubmit({ summaryConfig }) {
            if (tableSchema) {
              tableSchema['x-decorator-props'] = tableSchema['x-decorator-props'] || {};
              tableSchema['x-decorator-props'].summaryConfig = summaryConfig;

              dn.emit('patch', {
                schema: {
                  ['x-uid']: tableSchema['x-uid'],
                  'x-decorator-props': tableSchema['x-decorator-props'],
                },
              });
              dn.refresh();
            }
          },
        };
      },
    });
  }
}

export default PluginEnhancedTableBlockClient;
