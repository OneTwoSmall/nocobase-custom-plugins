/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TableBlockModel } from '@nocobase/client-v2';
import { tExpr } from '@nocobase/flow-engine';
import { observer } from '@formily/react';
import { useT } from '../locale';
import { NAMESPACE } from '../constants';
import {
  ENHANCED_TABLE_WRAPPER_CSS,
  SelectionStatsPopup,
  isNumericField,
  useCellSelection,
  useSummaryRowSync,
  type SummaryColumnMeta,
  type SummaryConfig,
} from './tableDomEnhancer';
// @ts-ignore
import pkg from '../../../package.json';

const ns = [pkg.name, NAMESPACE, 'client'];
const EMPTY_CONFIG: SummaryConfig = {};

let enableEnhancedTable = true;

export function setEnhancedTableEnabled(enabled: boolean) {
  enableEnhancedTable = enabled;
}

function isEnhancedTableEnabled() {
  return enableEnhancedTable;
}

const EnhancedTableWrapper = observer(({ model, children }: { model?: any; children: React.ReactNode }) => {
  if (!isEnhancedTableEnabled()) {
    return <>{children}</>;
  }
  const config: SummaryConfig = model?.props?.summaryConfig || EMPTY_CONFIG;
  if (Object.keys(config).length === 0) {
    return <>{children}</>;
  }
  return <EnhancedTableWrapperInner model={model}>{children}</EnhancedTableWrapperInner>;
});

const EnhancedTableWrapperInner = observer(({ model, children }: { model?: any; children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const [allPagesData, setAllPagesData] = useState<any[]>([]);
  const config: SummaryConfig = model?.props?.summaryConfig || EMPTY_CONFIG;
  const configKey = JSON.stringify(config);

  const columnMeta: SummaryColumnMeta = useMemo(() => {
    const numericFields = new Set<string>();
    const columnTitles: Record<string, string> = {};
    model?.mapSubModels?.('columns', (column: any) => {
      const collectionField = column?.collectionField;
      if (!collectionField) return;
      columnTitles[collectionField.name] = column.props?.title || collectionField.title || collectionField.name;
      if (isNumericField(collectionField)) {
        numericFields.add(collectionField.name);
      }
    });
    return { numericFields, columnTitles };
  }, [model]);

  const requestParamsStr = JSON.stringify((model?.resource as any)?.request?.params || {});
  const resourceDataStr = JSON.stringify(model?.resource?.getData?.() || []);

  useEffect(() => {
    if (Object.keys(config).length === 0 || typeof model?.resource?.runAction !== 'function') {
      setAllPagesData([]);
      return;
    }

    let isMounted = true;
    const fetchAllData = async () => {
      try {
        const currentOptions = (model.resource as any).getRefreshRequestOptions?.();
        const response = await model.resource.runAction('list', {
          method: 'get',
          ...currentOptions,
          params: {
            ...(currentOptions?.params || {}),
            paginate: false,
          },
        });
        if (!isMounted) return;
        let rows: any[] = [];
        if (response && Array.isArray(response.data)) {
          rows = response.data;
        } else if (response && Array.isArray(response)) {
          rows = response;
        }
        setAllPagesData(rows);
      } catch (err) {
        console.error('EnhancedTable fetchAllData Error: ', err);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
    // config 引用不稳定，用序列化字符串做依赖避免反复拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, configKey, requestParamsStr, resourceDataStr]);

  const labels = useMemo(
    () => ({
      sum: t('Sum'),
      avg: t('Average'),
      count: t('Count'),
      min: t('Min'),
      max: t('Max'),
    }),
    // 语言切换不频繁，避免 t 每次渲染变化导致汇总行同步反复重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configKey],
  );

  useSummaryRowSync(containerRef, config, allPagesData, columnMeta, labels);
  const { selectionStats, mousePos } = useCellSelection(containerRef, columnMeta);

  return (
    <div className={ENHANCED_TABLE_WRAPPER_CSS} ref={containerRef}>
      {children}
      {selectionStats && mousePos ? <SelectionStatsPopup stats={selectionStats} pos={mousePos} t={t} /> : null}
    </div>
  );
});

export class EnhancedTableBlockModel extends TableBlockModel {
  renderComponent() {
    const original = super.renderComponent();
    return <EnhancedTableWrapper model={this}>{original}</EnhancedTableWrapper>;
  }
}

EnhancedTableBlockModel.registerFlow({
  key: 'enhancedTableSettings',
  sort: 600,
  title: tExpr('Enhanced table settings', { ns }),
  steps: {
    summaryConfig: {
      title: tExpr('Summary row settings', { ns }),
      uiSchema: (ctx) => {
        const columnsToSelect: { label: string; value: string }[] = [];
        ctx.model.mapSubModels('columns', (column: any) => {
          const collectionField = column?.collectionField;
          if (!collectionField) return;
          if (isNumericField(collectionField)) {
            columnsToSelect.push({
              label: column.props?.title || collectionField.title || collectionField.name,
              value: collectionField.name,
            });
          }
        });

        return {
          summaryConfig: {
            type: 'object',
            'x-decorator': 'FormItem',
            'x-component': 'div',
            properties: columnsToSelect.reduce(
              (acc, col) => {
                acc[col.value] = {
                  type: 'string',
                  title: col.label,
                  'x-decorator': 'FormItem',
                  'x-component': 'Select',
                  'x-component-props': {
                    allowClear: true,
                    placeholder: `{{t("Select aggregation type", { ns: ${JSON.stringify(ns)} })}}`,
                    options: [
                      { label: `{{t("Sum", { ns: ${JSON.stringify(ns)} })}}`, value: 'sum' },
                      { label: `{{t("Average", { ns: ${JSON.stringify(ns)} })}}`, value: 'avg' },
                      { label: `{{t("Count", { ns: ${JSON.stringify(ns)} })}}`, value: 'count' },
                      { label: `{{t("Min", { ns: ${JSON.stringify(ns)} })}}`, value: 'min' },
                      { label: `{{t("Max", { ns: ${JSON.stringify(ns)} })}}`, value: 'max' },
                    ],
                  },
                };
                return acc;
              },
              {} as Record<string, any>,
            ),
          },
        };
      },
      defaultParams: { summaryConfig: {} },
      handler(ctx, params) {
        const config: SummaryConfig = {};
        for (const [key, value] of Object.entries(params.summaryConfig || {})) {
          if (value) {
            config[key] = value as SummaryConfig[string];
          }
        }
        ctx.model.setProps('summaryConfig', config);
      },
    },
  },
});

EnhancedTableBlockModel.define({
  label: tExpr('Enhanced Table', { ns }),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: () => ({
    use: 'TableBlockModel',
    subModels: {
      columns: [
        {
          use: 'TableActionsColumnModel',
        },
      ],
    },
  }),
  sort: 301,
});
