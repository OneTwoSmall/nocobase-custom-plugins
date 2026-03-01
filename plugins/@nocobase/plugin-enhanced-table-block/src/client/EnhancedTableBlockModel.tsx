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
import { useTranslation } from 'react-i18next';

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

export const EnhancedTableWrapper = observer(({ model, children }: { model?: any; children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionStats, setSelectionStats] = useState<{
    sum: number;
    min: number;
    max: number;
    avg: number;
    count: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const api = useAPIClient();
  const [allPagesData, setAllPagesData] = useState<any[]>([]);
  const { t } = useTranslation(['@nocobase/plugin-enhanced-table-block/client', 'client'], { nsMode: 'fallback' });

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

  const orderedColumns: string[] = [];
  const columnTitles: Record<string, string> = {};
  const numericFields = new Set<string>();

  if (isV1 && collection) {
    if (fieldSchema?.properties) {
      const tableSchema = Object.values(fieldSchema.properties).find((p: any) => p['x-component'] === 'TableV2') as any;
      if (tableSchema?.properties) {
        Object.values(tableSchema.properties).forEach((col: any) => {
          const name = col.name || col['x-collection-field'];
          if (name) orderedColumns.push(name);
        });
      }
    }
    collection.fields?.forEach((field: any) => {
      columnTitles[field.name] = field.uiSchema?.title || field.title || field.name;
      const isNumeric =
        ['integer', 'bigInt', 'float', 'double', 'decimal', 'number'].includes(field.type) ||
        ['number', 'integer', 'percent', 'currency'].includes(field.interface);
      if (isNumeric) numericFields.add(field.name);
    });
  } else if (!isV1 && typeof model?.mapSubModels === 'function') {
    model.mapSubModels('columns', (column: any) => {
      const collectionField = column?.collectionField;
      if (collectionField) {
        orderedColumns.push(collectionField.name);
        columnTitles[collectionField.name] = column.props?.title || collectionField.title || collectionField.name;
        const isNumeric =
          ['integer', 'bigInt', 'float', 'double', 'decimal', 'number'].includes(collectionField.type) ||
          ['number', 'integer', 'percent', 'currency'].includes(collectionField.interface);
        if (isNumeric) numericFields.add(collectionField.name);
      }
    });
  }

  const metadataRef = useRef({ numericFields, columnTitles, orderedColumns });
  metadataRef.current = { numericFields, columnTitles, orderedColumns };

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

      const selectedNumbers: number[] = [];

      const { numericFields, columnTitles } = metadataRef.current;
      const domColumnToNumericKey: Record<number, boolean> = {};
      const thead = container.querySelector('.ant-table-thead');
      if (thead) {
        const firstRow = thead.querySelector('tr');
        if (firstRow) {
          for (let i = 0; i < firstRow.children.length; i++) {
            const thText = firstRow.children[i].textContent || '';
            for (const field of numericFields) {
              const title = columnTitles[field];
              if (title && thText.includes(title)) {
                domColumnToNumericKey[i] = true;
                break;
              }
            }
          }
        }
      }

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

            if (!domColumnToNumericKey[c]) {
              continue;
            }

            td.classList.add('enhanced-selected-cell');
            const rawText = td.textContent || '';
            // Strip out known non-numeric characters for reliable parseFloat
            const cleanStr = rawText.replace(/[¥$€£￥,% ]/g, '').trim();
            const num = parseFloat(cleanStr);
            if (!isNaN(num)) {
              selectedNumbers.push(num);
            }
          }
        }
      });

      if (selectedNumbers.length > 1) {
        const sum = selectedNumbers.reduce((a, b) => a + b, 0);
        const max = Math.max(...selectedNumbers);
        const min = Math.min(...selectedNumbers);
        const avg = sum / selectedNumbers.length;
        setSelectionStats({ sum, min, max, avg, count: selectedNumbers.length });
      } else {
        setSelectionStats(null);
        setMousePos(null);
      }
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
        setSelectionStats(null);
        setMousePos(null);
        selectionState.current.startCell = null;
        selectionState.current.endCell = null;
        return;
      }

      const isInteractive = target.closest('button, a, input, textarea, .ant-checkbox-wrapper, .ant-radio-wrapper');
      if (isInteractive) return;

      selectionState.current.isSelecting = true;
      selectionState.current.startCell = getCellCoords(td);
      selectionState.current.endCell = selectionState.current.startCell;
      setMousePos({ x: e.clientX, y: e.clientY });
      updateSelection();

      // Allow text selection inside the cell
      // e.preventDefault() was here, preventing native text selection.
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!selectionState.current.isSelecting) return;
      setMousePos({ x: e.clientX, y: e.clientY });
      const td = (e.target as HTMLElement).closest('td');
      if (td) {
        const coords = getCellCoords(td);
        selectionState.current.endCell = coords;

        // If moving across different cells, clear native text selection to keep UI clean
        if (
          selectionState.current.startCell &&
          (selectionState.current.startCell.r !== coords.r || selectionState.current.startCell.c !== coords.c)
        ) {
          window.getSelection()?.removeAllRanges();
        }

        updateSelection();
      }
    };

    const onMouseUp = () => {
      selectionState.current.isSelecting = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    // We removed selectionSum from deps so event listeners are not recreated.
  }, []);

  const displayedColumns = orderedColumns.filter((c) => Object.keys(config).includes(c));
  Object.keys(config).forEach((c) => {
    if (!displayedColumns.includes(c)) displayedColumns.push(c);
  });

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
            <span style={{ color: '#000', fontWeight: 'bold' }}>
              {t('Summary row', { ns: '@nocobase/plugin-enhanced-table-block/client' })}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', flex: 1, justifyContent: 'flex-end' }}>
            {displayedColumns.map((dataIndex) => {
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

              const typeLabels: any = {
                sum: t('Sum', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
                avg: t('Average', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
                count: t('Count', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
                max: t('Max', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
                min: t('Min', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
              };

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

      {selectionStats && mousePos && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y + 15,
            pointerEvents: 'none',
            zIndex: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '13px',
            color: '#333',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div
            style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}
          >
            {t('Selection stats (contains {{num}} cells)', {
              ns: '@nocobase/plugin-enhanced-table-block/client',
              num: selectionStats.count,
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{t('Sum', { ns: '@nocobase/plugin-enhanced-table-block/client' })}：</span>
            <strong>{Number.isInteger(selectionStats.sum) ? selectionStats.sum : selectionStats.sum.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{t('Max', { ns: '@nocobase/plugin-enhanced-table-block/client' })}：</span>
            <strong>{Number.isInteger(selectionStats.max) ? selectionStats.max : selectionStats.max.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{t('Min', { ns: '@nocobase/plugin-enhanced-table-block/client' })}：</span>
            <strong>{Number.isInteger(selectionStats.min) ? selectionStats.min : selectionStats.min.toFixed(2)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
            <span>{t('Average', { ns: '@nocobase/plugin-enhanced-table-block/client' })}：</span>
            <strong>{Number.isInteger(selectionStats.avg) ? selectionStats.avg : selectionStats.avg.toFixed(2)}</strong>
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
  title: `{{t("Enhanced table settings", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
  steps: {
    summaryConfig: {
      title: `{{t("Summary row settings", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
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
                        label: `{{t("Sum", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
                        value: 'sum',
                      },
                      {
                        label: `{{t("Average", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
                        value: 'avg',
                      },
                      {
                        label: `{{t("Count", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
                        value: 'count',
                      },
                      {
                        label: `{{t("Min", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
                        value: 'min',
                      },
                      {
                        label: `{{t("Max", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
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
  label: `{{t("Enhanced Table", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
  group: `{{t("Content", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
  searchable: true,
  searchPlaceholder: `{{t("Search", { ns: "@nocobase/plugin-enhanced-table-block/client" })}}`,
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
