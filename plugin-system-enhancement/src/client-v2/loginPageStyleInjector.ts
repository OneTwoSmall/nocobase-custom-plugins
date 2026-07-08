/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const STYLE_ID = 'se-login-custom-style';
const CLASS_NAME = 'se-login-custom';
const AUTH_SEGMENTS = ['/signin', '/signup', '/forgot-password', '/reset-password'];

export interface LoginPageStyleSettings {
  loginBackgroundImage?: { url?: string } | null;
  loginFormPosition?: string;
  loginFormOffsetX?: number;
  loginFormOffsetY?: number;
  loginTitleFontSize?: string;
  loginTitleFontWeight?: string;
  loginTitleColor?: string;
  loginBackgroundSize?: string;
  loginBackgroundRepeat?: string;
  loginBackgroundPosition?: string;
}

let current: LoginPageStyleSettings = {};
let pollTimer: ReturnType<typeof setInterval> | null = null;

function isAuthPage(): boolean {
  const p = window.location.pathname;
  return AUTH_SEGMENTS.some((s) => p.endsWith(s) || p.includes(`${s}?`));
}

function buildCSS(s: LoginPageStyleSettings): string {
  const bgUrl = s.loginBackgroundImage?.url;
  const bgImage = bgUrl ? `url(${bgUrl})` : 'none';
  const bgSize = s.loginBackgroundSize || 'cover';
  const bgRepeat = s.loginBackgroundRepeat || 'no-repeat';
  const bgPosition = s.loginBackgroundPosition || 'center';

  const title: string[] = [];
  if (s.loginTitleFontSize) title.push(`font-size:${s.loginTitleFontSize}!important`);
  if (s.loginTitleFontWeight) title.push(`font-weight:${s.loginTitleFontWeight}!important`);
  if (s.loginTitleColor) title.push(`color:${s.loginTitleColor}!important`);

  const bgRule = [
    `background-image:${bgImage}!important;`,
    `background-size:${bgSize}!important;`,
    `background-repeat:${bgRepeat}!important;`,
    `background-position:${bgPosition}!important;`,
    `background-attachment:fixed!important;`,
  ].join('');

  return [
    `html.${CLASS_NAME},html.${CLASS_NAME} body,html.${CLASS_NAME} #root{min-height:100vh!important;${bgRule}}`,
    `html.${CLASS_NAME} #root>div{background:transparent!important;min-height:100vh!important;}`,
    `html.${CLASS_NAME} #root>div>div{background:transparent!important;}`,
    `html.${CLASS_NAME} #root>div>div>div{background:transparent!important;}`,
    title.length ? `html.${CLASS_NAME} h1{${title.join(';')}}` : '',
  ]
    .filter(Boolean)
    .join('');
}

function injectCSS() {
  removeCSS();
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = buildCSS(current);
  document.head.appendChild(el);
}

function removeCSS() {
  const el = document.getElementById(STYLE_ID);
  if (el) el.remove();
}

function syncClass() {
  const html = document.documentElement;
  if (isAuthPage()) {
    html.classList.add(CLASS_NAME);
  } else {
    html.classList.remove(CLASS_NAME);
  }
}

function applyContainerPos(s: LoginPageStyleSettings) {
  const pos = s.loginFormPosition || 'center';
  const ox = s.loginFormOffsetX ?? 0;
  const oy = s.loginFormOffsetY ?? 0;

  const divs = document.querySelectorAll<HTMLElement>('div');
  for (const div of divs) {
    const pt = div.style.paddingTop || getComputedStyle(div).paddingTop;
    if (!pt || !pt.includes('vh')) continue;

    div.style.setProperty('padding-top', `calc(20vh + ${oy}px)`, 'important');
    div.style.setProperty('padding-bottom', '20vh', 'important');

    switch (pos) {
      case 'left':
        div.style.setProperty('margin-left', `${ox}px`, 'important');
        div.style.setProperty('margin-right', 'auto', 'important');
        break;
      case 'right':
        div.style.setProperty('margin-left', 'auto', 'important');
        div.style.setProperty('margin-right', `${ox}px`, 'important');
        break;
      default:
        div.style.setProperty('margin-left', 'auto', 'important');
        div.style.setProperty('margin-right', 'auto', 'important');
        break;
    }

    let ancestor: HTMLElement | null = div.parentElement;
    const root = document.getElementById('root');
    while (ancestor && ancestor !== root && ancestor.tagName !== 'BODY') {
      if (ancestor.tagName === 'DIV') {
        ancestor.style.setProperty('background', 'transparent', 'important');
        ancestor.style.setProperty('background-color', 'transparent', 'important');
      }
      ancestor = ancestor.parentElement;
    }
  }
}

function startPoll() {
  if (pollTimer) return;
  applyContainerPos(current);

  let n = 0;
  pollTimer = setInterval(() => {
    n++;
    if (n > 30 || !isAuthPage()) {
      stopPoll();
      return;
    }
    applyContainerPos(current);
  }, 200);
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function handleRoute() {
  syncClass();
  if (isAuthPage()) {
    injectCSS();
    startPoll();
  } else {
    stopPoll();
  }
}

export function applyStyles(settings: LoginPageStyleSettings) {
  current = settings || {};
  handleRoute();
}

export function removeStyles() {
  removeCSS();
  stopPoll();
}

(function patchHistory() {
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  history.pushState = function (...args: Parameters<typeof originalPush>) {
    const r = originalPush(...args);
    handleRoute();
    return r;
  };
  history.replaceState = function (...args: Parameters<typeof originalReplace>) {
    const r = originalReplace(...args);
    handleRoute();
    return r;
  };

  window.addEventListener('popstate', handleRoute);
})();
