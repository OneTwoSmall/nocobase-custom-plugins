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

export type SummaryType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export type SummaryConfig = Record<string, SummaryType>;

export interface SelectionStats {
  sum: number;
  min: number;
  max: number;
  avg: number;
  count: number;
}

export interface SummaryColumnMeta {
  numericFields: Set<string>;
  columnTitles: Record<string, string>;
}

export const SELECTED_CELL_CLASS = 'enhanced-selected-cell';
export const SUMMARY_TFOOT_CLASS = 'enhanced-table-summary';

export const ENHANCED_TABLE_WRAPPER_CSS = css`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 7px;

  .enhanced-selected-cell {
    background-color: #ffff0033 !important;
    border: 1px solid #ffcc00 !important;
  }
`;

const SUMMARY_LABELS: Record<SummaryType, string> = {
  sum: 'Sum',
  avg: 'Average',
  count: 'Count',
  min: 'Min',
  max: 'Max',
};

export function isNumericField(field: { type?: string; interface?: string }): boolean {
  const numericTypes = ['integer', 'bigInt', 'float', 'double', 'decimal', 'number'];
  const numericInterfaces = ['number', 'integer', 'percent', 'currency'];
  return numericTypes.includes(field.type) || numericInterfaces.includes(field.interface);
}

/**
 * 提取行中指定字段的数值集合（字符串数字会被转换，非数字被过滤）。
 */
export function getNumericValues(rows: any[], dataIndex: string): number[] {
  return rows
    .map((row: any) => {
      const raw = row?.[dataIndex];
      if (typeof raw === 'function') {
        return null;
      }
      if (typeof raw === 'string') {
        return Number(raw);
      }
      return typeof raw === 'number' ? raw : null;
    })
    .filter((v: any): v is number => typeof v === 'number' && !isNaN(v));
}

/**
 * 计算单列聚合值。
 */
export function computeAggregation(values: number[], type: SummaryType): number | string {
  if (!values || values.length === 0) {
    return '';
  }
  let result: number;
  switch (type) {
    case 'sum':
      result = values.reduce((a, b) => a + b, 0);
      break;
    case 'avg':
      result = values.reduce((a, b) => a + b, 0) / values.length;
      break;
    case 'count':
      return values.length;
    case 'max':
      result = Math.max(...values);
      break;
    case 'min':
      result = Math.min(...values);
      break;
    default:
      return '';
  }
  return Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
}

/**
 * 计算汇总行数据：{ [dataIndex]: 聚合值 }。
 */
export function computeSummaryRow(rows: any[], config: SummaryConfig): Record<string, number | string> {
  const result: Record<string, number | string> = {};
  for (const [dataIndex, type] of Object.entries(config)) {
    result[dataIndex] = computeAggregation(getNumericValues(rows, dataIndex), type);
  }
  return result;
}

function getBodyTable(container: HTMLElement): HTMLTableElement | null {
  return container.querySelector('.ant-table-body table, .ant-table-content table') as HTMLTableElement | null;
}

function getHeaderCells(container: HTMLElement): HTMLElement[] {
  const thead = container.querySelector('.ant-table-thead');
  if (!thead) {
    return [];
  }
  const firstRow = Array.from(thead.querySelectorAll('tr')).find(
    (r) => !r.classList.contains('ant-table-measure-row'),
  ) as HTMLElement | undefined;
  if (!firstRow) {
    return [];
  }
  return Array.from(firstRow.children).filter(
    (el) => !(el as HTMLElement).classList.contains('ant-table-cell-scrollbar'),
  ) as HTMLElement[];
}

/**
 * 同步汇总行 DOM：在表格 table 元素内注入/更新 sticky 的 tfoot（antd summary 结构）。
 * 依赖标准 antd Table 的 DOM class（v1/v2 一致）。
 */
export function syncSummaryRowDom(
  container: HTMLElement,
  config: SummaryConfig,
  allPagesData: any[],
  columnMeta: SummaryColumnMeta,
  labels: Record<SummaryType, string>,
): void {
  const existing = container.querySelectorAll(`tfoot.${SUMMARY_TFOOT_CLASS}`);
  if (Object.keys(config).length === 0) {
    existing.forEach((el) => el.remove());
    return;
  }

  const headerCells = getHeaderCells(container);
  const bodyTable = getBodyTable(container);
  if (!bodyTable || headerCells.length === 0) {
    return;
  }

  const bodyFirstRow = bodyTable.querySelector('tbody tr') as HTMLElement | undefined;
  const bodyCells = bodyFirstRow ? (Array.from(bodyFirstRow.children) as HTMLElement[]) : [];

  let tfoot = bodyTable.querySelector(`tfoot.${SUMMARY_TFOOT_CLASS}`) as HTMLElement | null;
  if (!tfoot) {
    tfoot = document.createElement('tfoot');
    tfoot.className = `ant-table-summary ${SUMMARY_TFOOT_CLASS}`;
    tfoot.style.position = 'sticky';
    tfoot.style.bottom = '0';
    tfoot.style.zIndex = '3';
    tfoot.style.backgroundColor = '#fafafa';
    bodyTable.appendChild(tfoot);
  }

  let tr = tfoot.querySelector('tr') as HTMLElement | null;
  if (!tr) {
    tr = document.createElement('tr');
    tr.className = 'ant-table-row';
    tfoot.appendChild(tr);
  }

  const colCount = bodyCells.length || headerCells.length;
  while (tr.children.length < colCount) {
    tr.appendChild(document.createElement('td'));
  }
  while (tr.children.length > colCount) {
    tr.lastChild?.remove();
  }

  for (let i = 0; i < colCount; i++) {
    const th = headerCells[i] as HTMLElement | undefined;
    const td = tr.children[i] as HTMLElement;
    const bodyTd = bodyCells[i] as HTMLElement | undefined;
    const refCell = bodyTd || th;

    let classList = 'ant-table-cell';
    if (refCell) {
      refCell.classList.forEach((c) => {
        if (c.includes('fix-left') || c.includes('fix-right')) classList += ` ${c}`;
      });
    }
    if (td.className !== classList) td.className = classList;

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
      td.style.padding = '8px 4px';
    }

    const isSelectionColumn =
      refCell?.classList.contains('ant-table-selection-column') || !!refCell?.querySelector?.('.ant-checkbox-wrapper');
    const thText = th?.textContent?.trim() || '';
    const isActionColumn = thText === '操作' || thText === 'Actions';

    let matchedIndex: string | null = null;
    for (const [dataIndex] of Object.entries(config)) {
      const title = (columnMeta.columnTitles[dataIndex] || dataIndex).trim();
      if (title && thText === title && !isActionColumn && !isSelectionColumn) {
        matchedIndex = dataIndex;
        break;
      }
    }

    let newHTML = '';
    if (matchedIndex) {
      const type = config[matchedIndex];
      const result = computeAggregation(getNumericValues(allPagesData, matchedIndex), type);
      if (result !== '') {
        newHTML = `<div style="display: flex; flex-direction: column; align-items: flex-start; line-height: 1.4;">
          <span style="color: #1890ff; font-weight: bold; font-size: 14px; text-align: left;">${result}</span>
          <span style="color: #8c8c8c; font-size: 11px; font-weight: normal; letter-spacing: 0.5px; text-align: left;">${(
            labels[type] ||
            SUMMARY_LABELS[type] ||
            type
          ).toUpperCase()}</span>
        </div>`;
      }
    }

    if (td.dataset.contentHash !== newHTML) {
      td.dataset.contentHash = newHTML;
      td.innerHTML = newHTML;
    }
  }
}

/**
 * 汇总行同步 hook：监听容器变化，动态同步 sticky tfoot。
 */
export function useSummaryRowSync(
  containerRef: React.RefObject<HTMLDivElement | null>,
  config: SummaryConfig,
  allPagesData: any[],
  columnMeta: SummaryColumnMeta,
  labels: Record<SummaryType, string>,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    let updateRafId: number | null = null;
    let observer: MutationObserver | null = null;

    const scheduleUpdate = () => {
      if (updateRafId !== null) return;
      updateRafId = requestAnimationFrame(() => {
        updateRafId = null;
        observer?.disconnect();
        syncSummaryRowDom(container, config, allPagesData, columnMeta, labels);
        observer?.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class'],
        });
      });
    };

    syncSummaryRowDom(container, config, allPagesData, columnMeta, labels);
    observer = new MutationObserver(scheduleUpdate);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => {
      if (updateRafId !== null) cancelAnimationFrame(updateRafId);
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, allPagesData, columnMeta, labels]);
}

/**
 * 单元格圈选统计：返回清理函数。
 * 依赖标准 antd Table 的 td/tr/tbody DOM 结构。
 */
export function setupCellSelection(
  container: HTMLElement,
  columnMeta: SummaryColumnMeta,
  onChange: (stats: SelectionStats | null, pos: { x: number; y: number } | null) => void,
): () => void {
  const selectionState = {
    isSelecting: false,
    startCell: null as { r: number; c: number } | null,
    endCell: null as { r: number; c: number } | null,
  };

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
    const { startCell, endCell } = selectionState;
    if (!startCell || !endCell) return;
    const minR = Math.min(startCell.r, endCell.r);
    const maxR = Math.max(startCell.r, endCell.r);
    const minC = Math.min(startCell.c, endCell.c);
    const maxC = Math.max(startCell.c, endCell.c);

    const selectedNumbers: number[] = [];
    const domColumnToNumericKey: Record<number, boolean> = {};
    const thead = container.querySelector('.ant-table-thead');
    const firstRow = thead?.querySelector('tr');
    if (firstRow) {
      for (let i = 0; i < firstRow.children.length; i++) {
        const thText = (firstRow.children[i].textContent || '').trim();
        for (const field of columnMeta.numericFields) {
          const title = (columnMeta.columnTitles[field] || '').trim();
          if (title && thText === title) {
            domColumnToNumericKey[i] = true;
            break;
          }
        }
      }
    }

    container.querySelectorAll(`.${SELECTED_CELL_CLASS}`).forEach((el) => el.classList.remove(SELECTED_CELL_CLASS));

    container.querySelectorAll('.ant-table-tbody').forEach((tbody) => {
      for (let r = minR; r <= maxR; r++) {
        const tr = tbody.children[r];
        if (!tr) continue;
        for (let c = minC; c <= maxC; c++) {
          const td = tr.children[c] as HTMLElement | undefined;
          if (!td) continue;
          if (!domColumnToNumericKey[c]) continue;

          td.classList.add(SELECTED_CELL_CLASS);
          const cleanStr = (td.textContent || '').replace(/[¥$€£￥,% ]/g, '').trim();
          const num = parseFloat(cleanStr);
          if (!isNaN(num)) {
            selectedNumbers.push(num);
          }
        }
      }
    });

    if (selectedNumbers.length > 1) {
      const sum = selectedNumbers.reduce((a, b) => a + b, 0);
      onChange(
        {
          sum,
          max: Math.max(...selectedNumbers),
          min: Math.min(...selectedNumbers),
          avg: sum / selectedNumbers.length,
          count: selectedNumbers.length,
        },
        null,
      );
    } else {
      onChange(null, null);
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const td = target.closest('td');

    if (!td) {
      container.querySelectorAll(`.${SELECTED_CELL_CLASS}`).forEach((el) => el.classList.remove(SELECTED_CELL_CLASS));
      onChange(null, null);
      selectionState.startCell = null;
      selectionState.endCell = null;
      return;
    }

    if (target.closest('button, a, input, textarea, .ant-checkbox-wrapper, .ant-radio-wrapper')) return;

    selectionState.isSelecting = true;
    selectionState.startCell = getCellCoords(td);
    selectionState.endCell = selectionState.startCell;
    onChange(null, { x: e.clientX, y: e.clientY });
    updateSelection();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!selectionState.isSelecting) return;
    onChange(null, { x: e.clientX, y: e.clientY });
    const td = (e.target as HTMLElement).closest('td');
    if (td) {
      const coords = getCellCoords(td);
      if (!coords) return;
      selectionState.endCell = coords;
      if (
        selectionState.startCell &&
        (selectionState.startCell.r !== coords.r || selectionState.startCell.c !== coords.c)
      ) {
        window.getSelection()?.removeAllRanges();
      }
      updateSelection();
    }
  };

  const onMouseUp = () => {
    selectionState.isSelecting = false;
  };

  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  return () => {
    container.removeEventListener('mousedown', onMouseDown);
    container.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
}

/**
 * 圈选统计浮层（纯展示组件，v1/v2 共用）。
 */
export function SelectionStatsPopup({
  stats,
  pos,
  t,
}: {
  stats: SelectionStats;
  pos: { x: number; y: number };
  t: (key: string, options?: any) => string;
}) {
  const fmt = (v: number) => (Number.isInteger(v) ? v : v.toFixed(2));
  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x + 15,
        top: pos.y + 15,
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
      <div style={{ fontWeight: 'bold', marginBottom: '4px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
        {t('Selection stats (contains {{num}} cells)', { num: stats.count })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span>{t('Sum')}：</span>
        <strong>{fmt(stats.sum)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span>{t('Max')}：</span>
        <strong>{fmt(stats.max)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span>{t('Min')}：</span>
        <strong>{fmt(stats.min)}</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span>{t('Average')}：</span>
        <strong>{fmt(stats.avg)}</strong>
      </div>
    </div>
  );
}

export function useCellSelection(containerRef: React.RefObject<HTMLDivElement | null>, columnMeta: SummaryColumnMeta) {
  const [selectionStats, setSelectionStats] = useState<SelectionStats | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    return setupCellSelection(container, columnMeta, (stats, pos) => {
      if (pos) {
        setMousePos(pos);
      }
      if (stats) {
        setSelectionStats(stats);
      } else if (!pos) {
        setSelectionStats(null);
        setMousePos(null);
      }
    });
    // ref 对象在组件生命周期内稳定，无需作为依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnMeta]);

  return { selectionStats, mousePos };
}
