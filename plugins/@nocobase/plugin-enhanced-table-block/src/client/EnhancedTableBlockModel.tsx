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
  padding-bottom: 7px;

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
            const thText = (firstRow.children[i].textContent || '').trim();
            for (const field of numericFields) {
              const title = (columnTitles[field] || '').trim();
              // Use exact match to prevent false positives
              if (title && thText === title) {
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

  useEffect(() => {
    const tLabels: Record<string, string> = {
      sum: t('Sum', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
      avg: t('Average', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
      count: t('Count', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
      max: t('Max', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
      min: t('Min', { ns: '@nocobase/plugin-enhanced-table-block/client' }),
    };

    const container = containerRef.current;
    if (!container) return;

    if (Object.keys(config).length === 0) {
      container.querySelectorAll('.enhanced-table-summary').forEach((e) => e.remove());
      return;
    }

    const updateDOM = () => {
      const thead = container.querySelector('.ant-table-thead');
      if (!thead) return;
      const firstRow = Array.from(thead.querySelectorAll('tr')).find(
        (r) => !r.classList.contains('ant-table-measure-row'),
      ) as HTMLElement;
      if (!firstRow) return;

      const bodyTable = container.querySelector('.ant-table-body table, .ant-table-content table') as HTMLTableElement;
      if (!bodyTable) return;

      // Filter out AntD's scrollbar compensation column from header cells
      const headerCells = Array.from(firstRow.children).filter(
        (el) => !(el as HTMLElement).classList.contains('ant-table-cell-scrollbar'),
      ) as HTMLElement[];

      // Get body reference row for accurate position/width syncing
      const bodyFirstRow = bodyTable.querySelector('tbody tr') as HTMLElement;
      const bodyCells = bodyFirstRow ? (Array.from(bodyFirstRow.children) as HTMLElement[]) : [];

      let tfoot = bodyTable.querySelector('tfoot.enhanced-table-summary') as HTMLElement;
      if (!tfoot) {
        tfoot = document.createElement('tfoot');
        tfoot.className = 'ant-table-summary enhanced-table-summary';
        tfoot.style.position = 'sticky';
        tfoot.style.bottom = '0';
        tfoot.style.zIndex = '3'; // Ensure it's above table rows
        tfoot.style.backgroundColor = '#fafafa';
        bodyTable.appendChild(tfoot);
      }

      let tr = tfoot.querySelector('tr') as HTMLElement;
      if (!tr) {
        tr = document.createElement('tr');
        tr.className = 'ant-table-row';
        tfoot.appendChild(tr);
      }

      // Use body cell count (more accurate) or filtered header cell count
      const colCount = bodyCells.length || headerCells.length;

      // Ensure exact number of td elements
      while (tr.children.length < colCount) {
        const td = document.createElement('td');
        tr.appendChild(td);
      }
      while (tr.children.length > colCount) {
        if (tr.lastChild) tr.lastChild.remove();
      }

      // Sync columns and data
      let summaryTitleRendered = false;

      for (let i = 0; i < colCount; i++) {
        const th = headerCells[i] as HTMLElement | undefined;
        const td = tr.children[i] as HTMLElement;
        const bodyTd = bodyCells[i] as HTMLElement | undefined;

        // Use body cell for styling (more accurate alignment), fall back to header cell
        const refCell = bodyTd || th;

        // Copy fixed styling from reference cell
        let classList = 'ant-table-cell ';
        if (refCell) {
          refCell.classList.forEach((c) => {
            if (c.includes('fix-left') || c.includes('fix-right')) classList += c + ' ';
          });
        }
        classList = classList.trim();
        if (td.className !== classList) td.className = classList;

        // Sync sticky positioning from body cell (more accurate than header)
        if (bodyTd) {
          if (td.style.position !== bodyTd.style.position) td.style.position = bodyTd.style.position;
          if (td.style.left !== bodyTd.style.left) td.style.left = bodyTd.style.left;
          if (td.style.right !== bodyTd.style.right) td.style.right = bodyTd.style.right;
        } else if (th) {
          if (td.style.left !== th.style.left) td.style.left = th.style.left;
          if (td.style.right !== th.style.right) td.style.right = th.style.right;
        }

        if (td.dataset.initStyles !== 'true') {
          td.dataset.initStyles = 'true';
          td.style.backgroundColor = '#fafafa';
          td.style.borderTop = '2px solid #e8e8e8';
          td.style.borderBottom = '1px solid #e8e8e8';
          td.style.padding = '8px 16px';
        }

        // Determine if column is checkbox / action column
        const isSelectionColumn =
          (th || refCell)?.classList.contains('ant-table-selection-column') ||
          !!(th || refCell)?.querySelector?.('.ant-checkbox-wrapper');
        const thText = th?.textContent?.trim() || '';
        const isActionColumn =
          (th || refCell)?.classList.contains('nb-action-column') || thText === '操作' || thText === 'Actions';

        let matchedIndex: string | null = null;

        for (const [dataIndex] of Object.entries(config)) {
          const title = (metadataRef.current.columnTitles[dataIndex] || dataIndex).trim();
          // Use exact match to prevent false positives (e.g., field "a" matching "Created at")
          if (title && thText === title && !isActionColumn && !isSelectionColumn) {
            matchedIndex = dataIndex;
            break;
          }
        }

        let newHTML = '';

        if (matchedIndex) {
          const type = config[matchedIndex];
          let result: number | string = '';

          const values = allPagesData
            .map((row: any) => {
              let v = typeof row[matchedIndex] === 'function' ? null : row[matchedIndex];
              if (typeof v === 'string') v = Number(v);
              return typeof v === 'number' && !isNaN(v) ? v : null;
            })
            .filter((v: any) => v !== null) as number[];

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

          newHTML = `<div style="display: flex; flex-direction: column; line-height: 1.4;">
            <span style="color: #8c8c8c; font-size: 11px; font-weight: normal; letter-spacing: 0.5px;">${
              tLabels[type]?.toUpperCase() || type
            }</span>
            <span style="color: #1890ff; font-weight: bold; font-size: 14px;">${result}</span>
          </div>`;
          summaryTitleRendered = true;
        }

        // Instead of td.innerHTML !== newHTML, compare using dataset
        // Browsers parse innerHTML colors (e.g. #8c8c8c -> rgb(...)), returning a different string,
        // causing this to run repeatedly in a loop!
        if (td.dataset.contentHash !== newHTML) {
          td.dataset.contentHash = newHTML;
          td.innerHTML = newHTML;
        }
      }
    };

    let updateRafId: number | null = null;
    let observerObj: MutationObserver | null = null;

    const scheduleUpdate = () => {
      if (updateRafId !== null) return;
      updateRafId = requestAnimationFrame(() => {
        updateRafId = null;
        if (observerObj) observerObj.disconnect();
        updateDOM();
        if (observerObj) {
          observerObj.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class'],
          });
        }
      });
    };

    updateDOM();

    // Use MutationObserver to trigger update dynamically
    observerObj = new MutationObserver(() => scheduleUpdate());
    observerObj.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      if (updateRafId !== null) cancelAnimationFrame(updateRafId);
      if (observerObj) observerObj.disconnect();
    };
  }, [config, allPagesData, metadataRef.current.columnTitles, t]);

  return (
    <div className={wrapperCss} ref={containerRef}>
      {children}

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
