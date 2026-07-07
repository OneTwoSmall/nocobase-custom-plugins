/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import React, { useEffect, useRef, useState } from 'react';

const MIN_COLUMN_WIDTH = 50;

const wrapperClass = css`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
`;

const contentClass = css`
  flex: 1;
  overflow: hidden;
  min-width: 0;
`;

const resizeHandleClass = css`
  position: absolute;
  right: -8px;
  top: 0;
  bottom: 0;
  width: 16px;
  cursor: col-resize;
  z-index: 1;

  &::after {
    content: '';
    position: absolute;
    right: 7px;
    top: 20%;
    bottom: 20%;
    width: 2px;
    background: #d9d9d9;
    opacity: 0;
    transition: opacity 0.15s;
  }

  &:hover::after,
  &.resizing::after {
    opacity: 1;
  }
`;

export const ResizableHeader: React.FC<{
  model: any;
  width: number;
  persistFlowKey?: string;
  children: React.ReactNode;
}> = ({ model, width, persistFlowKey, children }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(width);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const latestWidthRef = useRef(width);

  useEffect(() => {
    if (!isResizing) {
      setCurrentWidth(width);
      latestWidthRef.current = width;
    }
  }, [width, isResizing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidthRef.current + delta);
    latestWidthRef.current = newWidth;
    setCurrentWidth(newWidth);
    model.setProps('width', newWidth);
  };

  const handlePointerUp = () => {
    if (!isResizing) return;
    setIsResizing(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    if (persistFlowKey && model?.setStepParams && model?.saveStepParams) {
      const finalWidth = latestWidthRef.current;
      model.setStepParams(persistFlowKey, 'width', { width: finalWidth });
      model.saveStepParams().catch(() => {});
    }
  };

  return (
    <div className={wrapperClass}>
      <div className={contentClass}>{children}</div>
      <div
        className={`${resizeHandleClass}${isResizing ? ' resizing' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
    </div>
  );
};
