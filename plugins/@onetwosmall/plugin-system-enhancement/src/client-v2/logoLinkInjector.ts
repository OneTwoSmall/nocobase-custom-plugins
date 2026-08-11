/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const LOGO_SELECTOR = '.ant-pro-global-header-logo a, #logo a';

import type { NavigateFunction } from 'react-router-dom';

/**
 * 校验绑定地址是否为当前系统内的相对路径，与 server 端规则保持一致。
 * 拒绝任意 scheme（javascript:、data: 等）、协议相对地址（//）、
 * 反斜杠与 ASCII 控制字符，防止存储型 XSS 与外部跳转。
 */
export function isSafeRelativeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.includes('\\')) {
    return false;
  }
  // eslint-disable-next-line no-control-regex -- 安全校验必须拒绝 ASCII 控制字符
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
    return false;
  }
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false;
  }
  if (trimmed.startsWith('//')) {
    return false;
  }
  return true;
}

let currentUrl = '';
let bound = false;
let getNavigate: (() => NavigateFunction) | null = null;

function handleClick(event: MouseEvent) {
  if (!currentUrl) {
    return;
  }
  const target = event.target as Element | null;
  if (!target || !(target instanceof Element) || !target.closest(LOGO_SELECTOR)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const navigate = getNavigate?.();
  if (navigate) {
    // SPA 跳转，避免整页刷新
    navigate(currentUrl);
  } else {
    window.location.href = currentUrl;
  }
}

export function applyLogoLink(url: string, getRouterNavigate?: () => NavigateFunction) {
  currentUrl = (url || '').trim();
  if (getRouterNavigate) {
    getNavigate = getRouterNavigate;
  }
  if (!bound) {
    bound = true;
    document.addEventListener('click', handleClick, true);
  }
}
