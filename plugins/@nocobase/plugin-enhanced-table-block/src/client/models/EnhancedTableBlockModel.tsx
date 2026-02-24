/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { TableBlockModel } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { Table, Skeleton } from 'antd';
import { get } from 'lodash';
import React from 'react';

// ─── 聚合类型 ───
export type SummaryType = 'sum' | 'avg' | 'count' | 'min' | 'max';

const SUMMARY_TYPE_LABELS: Record<SummaryType, string> = {
  sum: 'Sum',
  avg: 'Average',
  count: 'Count',
  min: 'Min',
  max: 'Max',
};

// ─── 聚合计算工具 ───
function computeSummary(data: any[], dataIndex: string, type: SummaryType): number | string {
  if (!data || data.length === 0) return '-';
  // 确保值是数字
  const values = data
    .map((row) => {
      const v = get(row, dataIndex);
      return typeof v === 'number' ? v : parseFloat(v);
    })
    .filter((v) => !isNaN(v));

  if (values.length === 0) return '-';

  switch (type) {
    case 'sum':
      return parseFloat(values.reduce((a, b) => a + b, 0).toFixed(2));
    case 'avg':
      return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return '-';
  }
}

// ─── 增强表格模型 ───
export class EnhancedTableBlockModel extends TableBlockModel {
  /**
   * 获取合计行配置：{ [dataIndex]: SummaryType }
   */
  getSummaryConfig(): Record<string, SummaryType> {
    return this.props.summaryConfig || {};
  }

  /**
   * 计算合计行数据
   */
  computeSummaryRow(dataSource: any[]): Record<string, any> {
    const config = this.getSummaryConfig();
    const result: Record<string, any> = {};
    for (const [dataIndex, type] of Object.entries(config)) {
      result[dataIndex] = computeSummary(dataSource, dataIndex, type);
    }
    return result;
  }

  /**
   * 重写 renderComponent，在表格底部添加合计行
   */
  renderComponent() {
    // 使用 autorun 跟踪的 columns (访问属性以触发响应式依赖)
    if (!(this as any).columns?.value?.length) {
      return <Skeleton paragraph={{ rows: 3 }} />;
    }

    // 调用父类方法获取基础渲染
    const parentRender = super.renderComponent();

    // 如果没有合计配置，使用原始渲染
    const config = this.getSummaryConfig();
    if (Object.keys(config).length === 0) {
      return parentRender;
    }

    // 有合计配置时，需要将 summary 注入
    return <EnhancedTableWrapper model={this}>{parentRender}</EnhancedTableWrapper>;
  }
}

/**
 * 增强表格包装器 - 通过 CSS 注入合计行
 */
const EnhancedTableWrapper = ({ model, children }: { model: EnhancedTableBlockModel; children: React.ReactNode }) => {
  const dataSource = model.resource?.getData?.() || [];
  const config = model.getSummaryConfig();
  const configEntries = Object.entries(config);
  const summaryRow = model.computeSummaryRow(dataSource);

  // 获取当前可见列
  const columns = model
    .getColumns()
    .filter((col: any) => col && col.key !== 'empty' && col.key !== 'addColumn' && !col.hidden);

  if (configEntries.length === 0) {
    return <>{children}</>;
  }

  return (
    <div
      className={css`
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
      `}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>
      <div
        className={css`
          display: flex;
          background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
          border: 1px solid #d6e4ff;
          border-top: 2px solid #adc6ff;
          border-radius: 0 0 8px 8px;
          padding: 8px 0;
          margin-top: -1px;
          overflow-x: auto;
          flex-shrink: 0;
        `}
      >
        {/* checkbox 列占位 (根据需要调整宽度) */}
        <div
          className={css`
            min-width: 50px;
            max-width: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #1d39c4;
            font-size: 16px;
            flex-shrink: 0;
          `}
        >
          ∑
        </div>

        {columns.map((col: any, idx: number) => {
          const dataIndex = col.dataIndex;
          const summaryType = config[dataIndex];
          const value = summaryRow[dataIndex];
          const width = col.width || 150;

          return (
            <div
              key={col.key || dataIndex || idx}
              className={css`
                min-width: ${width}px;
                padding: 4px 8px;
                flex-shrink: 0;
              `}
            >
              {summaryType ? (
                <div
                  className={css`
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                  `}
                >
                  <span
                    className={css`
                      font-size: 11px;
                      color: #8c8c8c;
                      line-height: 1;
                    `}
                  >
                    {model.translate(SUMMARY_TYPE_LABELS[summaryType])}
                  </span>
                  <span
                    className={css`
                      color: #1d39c4;
                      font-size: 14px;
                      font-weight: 700;
                    `}
                  >
                    {value}
                  </span>
                </div>
              ) : idx === 0 ? (
                <span
                  className={css`
                    color: #595959;
                    font-weight: 600;
                    font-size: 13px;
                  `}
                >
                  {model.translate('Summary')}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 注册 flow：合计行设置 ───
EnhancedTableBlockModel.registerFlow({
  key: 'enhancedTableSettings',
  sort: 600,
  title: tExpr('Enhanced table settings', { ns: ['@nocobase/plugin-enhanced-table-block', 'client'] }),
  steps: {
    summaryConfig: {
      title: tExpr('Summary row settings', { ns: ['@nocobase/plugin-enhanced-table-block', 'client'] }),
      uiSchema: (ctx) => {
        const columns: { label: string; value: string }[] = [];
        ctx.model.mapSubModels('columns', (column: any) => {
          const collectionField = column?.collectionField;
          if (!collectionField) return;
          const fieldType = collectionField.type;
          const fieldInterface = collectionField.interface;
          const numericTypes = ['integer', 'bigInt', 'float', 'double', 'decimal', 'number'];
          const numericInterfaces = ['number', 'integer', 'percent', 'currency'];
          if (numericTypes.includes(fieldType) || numericInterfaces.includes(fieldInterface)) {
            columns.push({
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
            properties: columns.reduce(
              (acc, col) => {
                acc[col.value] = {
                  type: 'string',
                  title: col.label,
                  'x-decorator': 'FormItem',
                  'x-component': 'Select',
                  'x-component-props': {
                    allowClear: true,
                    placeholder: ctx.t('Select aggregation type'),
                    options: [
                      { label: ctx.t('Sum'), value: 'sum' },
                      { label: ctx.t('Average'), value: 'avg' },
                      { label: ctx.t('Count'), value: 'count' },
                      { label: ctx.t('Min'), value: 'min' },
                      { label: ctx.t('Max'), value: 'max' },
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
      defaultParams: {
        summaryConfig: {},
      },
      handler(ctx, params) {
        const config: Record<string, SummaryType> = {};
        if (params.summaryConfig) {
          for (const [key, value] of Object.entries(params.summaryConfig)) {
            if (value) {
              config[key] = value as SummaryType;
            }
          }
        }
        ctx.model.setProps('summaryConfig', config);
      },
    },
  },
});

// ─── 定义模型元信息 ───
EnhancedTableBlockModel.define({
  label: tExpr('Enhanced Table', { ns: ['@nocobase/plugin-enhanced-table-block', 'client'] }),
  group: tExpr('Content'),
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: () => ({
    use: 'EnhancedTableBlockModel',
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

export default EnhancedTableBlockModel;
