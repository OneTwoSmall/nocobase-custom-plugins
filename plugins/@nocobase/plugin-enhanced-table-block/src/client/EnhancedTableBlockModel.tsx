/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import { TableBlockModel, useAPIClient, useTableBlockContext, useCollection_deprecated } from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import { observer, useFieldSchema } from '@formily/react';

const wrapperCss = css`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;

  .enhanced-selected-cell {
    background-color: #ffff0033 !important; /* light yellow to match screenshot */
    border: 1px solid #ffcc00 !important;
  }
`;

function getNumberFromText(text: string) {
  if (!text) return null;
  // match numbers even with commas or decimals, but exclude dates if possible.
  // simplified regex for floats
  const numStr = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return numStr ? parseFloat(numStr[0]) : null;
}

export const EnhancedTableWrapper = observer(({ model, children }: { model?: any; children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionSum, setSelectionSum] = useState<number | null>(null);
  const api = useAPIClient();
  const [allPagesData, setAllPagesData] = useState<any[]>([]);

  // V1 Fallbacks
  const blockContext = useTableBlockContext();
  const collection = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const isV1 = !model;

  const config = isV1 ? fieldSchema?.['x-decorator-props']?.summaryConfig || {} : model?.props?.summaryConfig || {};

  const requestParams = isV1 ? blockContext?.service?.params?.[0] : (model?.resource as any)?.request?.params;

  const paramsStr = JSON.stringify(requestParams || {});

  const resourceDataStr = isV1
    ? JSON.stringify(blockContext?.service?.data?.data || [])
    : JSON.stringify(model?.resource?.getData?.() || []);

  useEffect(() => {
    if (Object.keys(config).length === 0) {
      setAllPagesData([]);
      return;
    }

    let isMounted = true;
    const fetchAllData = async () => {
      try {
        if (isV1 && blockContext?.service) {
          // V1 API Call
          const requestParams = {
            ...(blockContext.service.params?.[0] || {}),
            paginate: false,
          };
          let responseData;
          if (blockContext.resource && typeof blockContext.resource.list === 'function') {
            const response = await blockContext.resource.list(requestParams);
            responseData = response?.data;
          } else {
            const resourceName =
              typeof blockContext.resource === 'string'
                ? blockContext.resource
                : blockContext.association || blockContext.collection;
            if (!resourceName) return;
            const response = await api.request({
              url: `${resourceName}:list`,
              params: requestParams,
            });
            responseData = response?.data;
          }

          if (isMounted) {
            let rows: any[] = [];
            if (Array.isArray(responseData)) {
              rows = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
              rows = responseData.data;
            } else if (responseData && Array.isArray(responseData.rows)) {
              rows = responseData.rows;
            }
            setAllPagesData(rows);
          }
        } else if (!isV1 && typeof model?.resource?.runAction === 'function') {
          // V2 API Call
          const currentOptions = model.resource.getRefreshRequestOptions();
          const response = await model.resource.runAction('list', {
            method: 'get',
            ...currentOptions,
            params: {
              ...(currentOptions?.params || {}),
              paginate: false,
            },
          });

          if (isMounted) {
            let rows: any[] = [];
            if (response && Array.isArray(response.data)) {
              rows = response.data;
            } else if (response && Array.isArray(response)) {
              rows = response;
            }
            setAllPagesData(rows);
          }
        }
      } catch (err) {
        console.error('EnhancedTable fetchAllData Error: ', err);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, [model, paramsStr, JSON.stringify(config), resourceDataStr, isV1]);

  // Track selection state in a ref so event listeners don't need to be recreated (which broke dragging)
  const selectionState = useRef({
    isSelecting: false,
    startCell: null as { r: number; c: number } | null,
    endCell: null as { r: number; c: number } | null,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getCellCoords = (td: HTMLElement) => {
      const tr = td.parentElement;
      if (!tr) return null;
      const tbody = tr.parentElement;
      if (!tbody) return null;
      return {
        r: Array.prototype.indexOf.call(tbody.children, tr),
        c: Array.prototype.indexOf.call(tr.children, td),
      };
    };

    const updateSelection = () => {
      const { startCell, endCell } = selectionState.current;
      if (!startCell || !endCell) return;
      const minR = Math.min(startCell.r, endCell.r);
      const maxR = Math.max(startCell.r, endCell.r);
      const minC = Math.min(startCell.c, endCell.c);
      const maxC = Math.max(startCell.c, endCell.c);

      let sum = 0;
      let hasNumbers = false;

      container
        .querySelectorAll('.enhanced-selected-cell')
        .forEach((el) => el.classList.remove('enhanced-selected-cell'));

      const tbodys = container.querySelectorAll('.ant-table-tbody');
      tbodys.forEach((tbody) => {
        for (let r = minR; r <= maxR; r++) {
          const tr = tbody.children[r];
          if (!tr) continue;
          for (let c = minC; c <= maxC; c++) {
            const td = tr.children[c] as HTMLElement;
            if (!td) continue;

            // Skip action columns, selection columns, and typically sequence columns
            if (
              td.classList.contains('ant-table-selection-column') ||
              td.querySelector('button, a, input, textarea, .nb-action-link') ||
              td.closest('.ant-table-cell-fix-left') ||
              td.closest('.ant-table-cell-fix-right')
            ) {
              continue;
            }

            // Also check header to avoid Sequence columns
            const th = tbody.parentElement?.querySelector(`thead tr th:nth-child(${c + 1})`);
            if (th && (th.textContent?.includes('序号') || th.textContent?.includes('Index'))) {
              continue;
            }

            td.classList.add('enhanced-selected-cell');
            const num = getNumberFromText(td.textContent || '');
            if (num !== null) {
              sum += num;
              hasNumbers = true;
            }
          }
        }
      });

      setSelectionSum(hasNumbers ? sum : null);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      const td = target.closest('td');

      if (!td) {
        // We do not read state from dependencies, just clear the UI
        container
          .querySelectorAll('.enhanced-selected-cell')
          .forEach((el) => el.classList.remove('enhanced-selected-cell'));
        setSelectionSum(null);
        selectionState.current.startCell = null;
        selectionState.current.endCell = null;
        return;
      }

      const isInteractive = target.closest('button, a, input, textarea, .ant-checkbox-wrapper, .ant-radio-wrapper');
      if (isInteractive) return;

      selectionState.current.isSelecting = true;
      selectionState.current.startCell = getCellCoords(td);
      selectionState.current.endCell = selectionState.current.startCell;
      updateSelection();

      // Prevent text selection drag artifacts only inside the table body
      if (target.closest('.ant-table-tbody')) {
        e.preventDefault();
      }
    };

    const onMouseEnter = (e: MouseEvent) => {
      if (!selectionState.current.isSelecting) return;
      const td = (e.target as HTMLElement).closest('td');
      if (td) {
        selectionState.current.endCell = getCellCoords(td);
        updateSelection();
      }
    };

    const onMouseUp = () => {
      selectionState.current.isSelecting = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseover', onMouseEnter);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseover', onMouseEnter);
      window.removeEventListener('mouseup', onMouseUp);
    };
    // We removed selectionSum from deps so event listeners are not recreated.
  }, []);

  const columnTitles: Record<string, string> = {};
  if (isV1 && collection) {
    Object.keys(config).forEach((name) => {
      const field = collection.getField(name);
      if (field) {
        columnTitles[name] = field.uiSchema?.title || field.title || field.name || name;
      }
    });
  } else if (!isV1 && typeof model?.mapSubModels === 'function') {
    model.mapSubModels('columns', (column: any) => {
      const collectionField = column?.collectionField;
      if (collectionField) {
        columnTitles[collectionField.name] = column.props?.title || collectionField.title || collectionField.name;
      }
    });
  }

  return (
    <div className={wrapperCss} ref={containerRef}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>{children}</div>

      {true && (
        <div
          style={{
            display: 'flex',
            background: '#fff',
            borderTop: '2px solid #000',
            padding: '8px 16px',
            alignItems: 'center',
            gap: '24px',
            fontWeight: 500,
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: '#000', fontWeight: 'bold' }}>合计</span>
          </div>

          {selectionSum !== null && (
            <div style={{ color: '#000' }}>
              求和: {Number.isInteger(selectionSum) ? selectionSum : selectionSum.toFixed(2)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', flex: 1 }}>
            {Object.keys(config).map((dataIndex) => {
              const type = config[dataIndex];
              if (!type) return null;

              const title = columnTitles[dataIndex] || dataIndex;

              // Use allPagesData (fetched from API without pagination) instead of current page dataSource
              const values = allPagesData
                .map((row: any) => {
                  let v = typeof row[dataIndex] === 'function' ? null : row[dataIndex];
                  if (typeof v === 'string') v = Number(v);
                  return typeof v === 'number' && !isNaN(v) ? v : null;
                })
                .filter((v: any) => v !== null) as number[];

              let result: number | string = '';
              if (values.length > 0) {
                if (type === 'sum') result = values.reduce((a, b) => a + b, 0);
                else if (type === 'avg') result = values.reduce((a, b) => a + b, 0) / values.length;
                else if (type === 'count') result = values.length;
                else if (type === 'max') result = Math.max(...values);
                else if (type === 'min') result = Math.min(...values);

                if (typeof result === 'number' && !Number.isInteger(result)) {
                  result = parseFloat(result.toFixed(2));
                }
              }

              const typeLabels: any = { sum: '求和', avg: '平均', count: '计数', max: '最大', min: '最小' };

              return (
                <div key={dataIndex} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', color: '#000' }}>
                  <span>
                    {typeof title === 'string' ? title : dataIndex}({typeLabels[type]})：{result}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
  title: `{{t("Enhanced table settings", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "增强表格设置" })}}`,
  steps: {
    summaryConfig: {
      title: `{{t("Summary row settings", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "合计行设置" })}}`,
      uiSchema: (ctx) => {
        const columnsToSelect: { label: string; value: string; disabled?: boolean }[] = [];
        if (typeof ctx.model.mapSubModels === 'function') {
          ctx.model.mapSubModels('columns', (column: any) => {
            const collectionField = column?.collectionField;
            if (!collectionField) return;

            const isNumeric =
              ['integer', 'bigInt', 'float', 'double', 'decimal', 'number'].includes(collectionField.type) ||
              ['number', 'integer', 'percent', 'currency'].includes(collectionField.interface);
            if (isNumeric) {
              columnsToSelect.push({
                label: column.props?.title || collectionField.title || collectionField.name,
                value: collectionField.name,
              });
            }
          });
        }

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
                    options: [
                      {
                        label: `{{t("Sum", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "求和" })}}`,
                        value: 'sum',
                      },
                      {
                        label: `{{t("Average", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "平均" })}}`,
                        value: 'avg',
                      },
                      {
                        label: `{{t("Count", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "计数" })}}`,
                        value: 'count',
                      },
                      {
                        label: `{{t("Min", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "最小值" })}}`,
                        value: 'min',
                      },
                      {
                        label: `{{t("Max", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "最大值" })}}`,
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
        };
      },
      defaultParams: { summaryConfig: {} },
      handler(ctx, params) {
        ctx.model.setProps('summaryConfig', params.summaryConfig || {});
      },
    },
  },
});

EnhancedTableBlockModel.define({
  label: `{{t("Enhanced Table", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "增强表格" })}}`,
  group: `{{t("Content", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "内容区块" })}}`,
  searchable: true,
  searchPlaceholder: `{{t("Search", { ns: "@nocobase/plugin-enhanced-table-block/client", defaultValue: "搜索" })}}`,
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
