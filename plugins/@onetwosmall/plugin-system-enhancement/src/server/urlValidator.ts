/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 校验 logoLinkUrl 是否为本系统内的安全相对路径。
 * 拒绝任意 scheme（javascript:、data: 等）、协议相对地址（//）、
 * 反斜杠与 ASCII 控制字符，防止存储型 XSS 与外部跳转。
 */
export function isSafeRelativeUrl(value: unknown): boolean {
  if (typeof value !== 'string') {
    return true;
  }

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
