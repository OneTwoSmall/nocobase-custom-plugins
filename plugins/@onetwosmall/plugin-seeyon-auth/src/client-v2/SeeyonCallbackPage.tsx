/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import React, { useEffect, useRef, useState } from 'react';

const S = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  } as React.CSSProperties,
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '48px 56px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
    textAlign: 'center' as const,
    maxWidth: 380,
    width: '90%',
  },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 },
  sub: { fontSize: 14, color: '#888', marginBottom: 28 },
  spin: { marginBottom: 20 },
  hint: { fontSize: 12, color: '#bbb' },
  act: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  btn1: {
    width: '100%',
    padding: '10px 0',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btn2: {
    width: '100%',
    padding: '10px 0',
    border: '1px solid #ddd',
    borderRadius: 8,
    background: 'transparent',
    color: '#888',
    fontSize: 15,
    cursor: 'pointer',
  },
};

function Spinner({ stops }: { stops: [string, string] }) {
  const [c1, c2] = stops;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44">
      <circle cx="22" cy="22" r="18" fill="none" stroke="#eee" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke={`url(#g${c1})`}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="90"
        strokeDashoffset="70"
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 22 22"
          to="360 22 22"
          dur="0.9s"
          repeatCount="indefinite"
        />
      </circle>
      <defs>
        <linearGradient id={`g${c1}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function SeeyonCallbackPage() {
  const ctx = useFlowContext();
  const started = useRef(Date.now());
  const [state, setState] = useState<'loading' | 'ok' | 'err'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const marker = '/seeyon-auth/callback';
  const markerIdx = location.pathname.indexOf(marker);
  const appPrefix = markerIdx > 0 ? location.pathname.substring(0, markerIdx) : '';
  const customPath =
    markerIdx !== -1
      ? (() => {
          const raw = location.pathname.substring(markerIdx + marker.length).replace(/^\//, '');
          return /^(?:[a-zA-Z0-9_\-/.]+)?$/.test(raw) ? raw : '';
        })()
      : '';

  useEffect(() => {
    document.title = '致远OA 单点登录';
    const search = location.search || '';
    const ticket =
      new URLSearchParams(search).get('v5ticket') ||
      new URLSearchParams(search).get('ticket') ||
      search.match(/[?&]ticket=([^&]+)/)?.[1] ||
      search.match(/[?&]v5ticket=([^&]+)/)?.[1] ||
      (undefined as string | undefined);
    if (!ticket) {
      location.replace(`${appPrefix}/v/admin/signin?error=missing_ticket`);
      return;
    }

    ctx.api
      .resource('seeyonAuth')
      .callback({ values: { v5ticket: ticket } })
      .then(async (res) => {
        const remaining = 800 - (Date.now() - started.current);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
        setState('ok');
        await new Promise((resolve) => setTimeout(resolve, 120));
        const { token } = res.data.data;
        const target = customPath
          ? `${appPrefix}/v/admin/${customPath}?token=${encodeURIComponent(token)}`
          : `${appPrefix}/v/admin/?token=${encodeURIComponent(token)}`;
        location.replace(target);
      })
      .catch((err: any) => {
        setErrMsg(err?.data?.errors?.[0]?.message || err?.message || 'OA 单点登录验证未通过，请重新尝试');
        setState('err');
      });
  }, [ctx.api]);

  const retry = () => location.reload();
  const home = () => location.replace(`${appPrefix}/v/admin/`);

  if (state === 'err')
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>&#9888;&#65039;</div>
          <div style={S.title}>认证失败</div>
          <div style={{ ...S.sub, marginBottom: 28 }}>{errMsg}</div>
          <div style={S.act}>
            <button onClick={retry} style={S.btn1}>
              重新尝试
            </button>
            <button onClick={home} style={S.btn2}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    );

  if (state === 'ok')
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={{ fontSize: 50, marginBottom: 12 }}>&#9989;</div>
          <div style={S.title}>验证成功</div>
          <div style={S.sub}>正在跳转到目标页面...</div>
          <div style={S.spin}>
            <Spinner stops={['#52c41a', '#389e0d']} />
          </div>
          <div style={S.hint}>即将跳转</div>
        </div>
      </div>
    );

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.icon}>&#128274;</div>
        <div style={S.title}>致远OA 单点登录</div>
        <div style={S.sub}>正在验证您的身份信息...</div>
        <div style={S.spin}>
          <Spinner stops={['#667eea', '#764ba2']} />
        </div>
        <div style={S.hint}>请稍候</div>
      </div>
    </div>
  );
}
