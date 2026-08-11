/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyLogoLink, isSafeRelativeUrl } from '../logoLinkInjector';

function createLogoDom() {
  const wrapper = document.createElement('span');
  wrapper.className = 'ant-pro-global-header-logo';
  const link = document.createElement('a');
  const img = document.createElement('img');
  link.appendChild(img);
  wrapper.appendChild(link);
  document.body.appendChild(wrapper);
  return { wrapper, link, img };
}

function clickOn(el: Element) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
  applyLogoLink('');
});

describe('isSafeRelativeUrl', () => {
  it('should allow relative paths and reject absolute urls', () => {
    expect(isSafeRelativeUrl('/admin')).toBe(true);
    expect(isSafeRelativeUrl('admin/users')).toBe(true);
    expect(isSafeRelativeUrl('')).toBe(true);
    expect(isSafeRelativeUrl('https://evil.com')).toBe(false);
    expect(isSafeRelativeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeRelativeUrl('//evil.com')).toBe(false);
  });
});

describe('logoLinkInjector', () => {
  it('should navigate via router when logo is clicked', () => {
    const navigate = vi.fn();
    applyLogoLink('/admin', () => navigate);
    const { img } = createLogoDom();

    const event = clickOn(img);

    expect(event.defaultPrevented).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/admin');
  });

  it('should not intercept clicks when url is empty', () => {
    const navigate = vi.fn();
    applyLogoLink('', () => navigate);
    const { link } = createLogoDom();

    const event = clickOn(link);

    expect(event.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('should not intercept clicks outside the logo', () => {
    const navigate = vi.fn();
    applyLogoLink('/admin', () => navigate);
    const other = document.createElement('button');
    document.body.appendChild(other);

    const event = clickOn(other);

    expect(event.defaultPrevented).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
