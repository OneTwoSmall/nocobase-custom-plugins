/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Button, Card, ColorPicker, Form, Input, InputNumber, message, Radio, Select, Space, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';
import { applyStyles } from '../loginPageStyleInjector';

const FONT_WEIGHTS = [
  { label: '300', value: '300' },
  { label: '400', value: '400' },
  { label: '500', value: '500' },
  { label: '600', value: '600' },
  { label: '700', value: '700' },
  { label: '800', value: '800' },
];

const FONT_SIZES = [
  { label: '24px', value: '24px' },
  { label: '28px', value: '28px' },
  { label: '32px', value: '32px' },
  { label: '36px', value: '36px' },
  { label: '40px', value: '40px' },
  { label: '48px', value: '48px' },
  { label: '56px', value: '56px' },
  { label: '64px', value: '64px' },
];

const POSITIONS = [
  { label: 'Left', value: 'left' },
  { label: 'Center', value: 'center' },
  { label: 'Right', value: 'right' },
];

const BG_SIZES = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Auto', value: 'auto' },
  { label: '100%', value: '100%' },
];

const BG_REPEATS = [
  { label: 'No Repeat', value: 'no-repeat' },
  { label: 'Repeat', value: 'repeat' },
  { label: 'Repeat X', value: 'repeat-x' },
  { label: 'Repeat Y', value: 'repeat-y' },
];

const BG_POSITIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Top Left', value: 'top left' },
  { label: 'Top Right', value: 'top right' },
  { label: 'Bottom Left', value: 'bottom left' },
  { label: 'Bottom Right', value: 'bottom right' },
];

const DEFAULTS = {
  loginFormPosition: 'center',
  loginFormOffsetX: 0,
  loginFormOffsetY: 0,
  loginBackgroundSize: 'cover',
  loginBackgroundRepeat: 'no-repeat',
  loginBackgroundPosition: 'center',
};

function LoginPagePreview({ values }: { values: Record<string, unknown> }) {
  const t = useT();
  const pos = (values.loginFormPosition as string) || 'center';
  const ox = (values.loginFormOffsetX as number) ?? 0;
  const oy = (values.loginFormOffsetY as number) ?? 0;
  const bgUrl = (values.loginBackgroundImage as { url?: string } | null)?.url || '';
  const bgSize = (values.loginBackgroundSize as string) || 'cover';
  const bgRepeat = (values.loginBackgroundRepeat as string) || 'no-repeat';
  const bgPosition = (values.loginBackgroundPosition as string) || 'center';
  const fs = values.loginTitleFontSize as string;
  const fw = values.loginTitleFontWeight as string;
  const fc = values.loginTitleColor as string;

  let m: React.CSSProperties = {};
  if (pos === 'left') m = { marginLeft: ox, marginRight: 'auto' };
  else if (pos === 'right') m = { marginLeft: 'auto', marginRight: ox };
  else m = { marginLeft: 'auto', marginRight: 'auto' };

  return (
    <div
      style={{
        width: '100%',
        height: 520,
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: bgSize,
        backgroundRepeat: bgRepeat,
        backgroundPosition: bgPosition,
        backgroundColor: bgUrl ? 'transparent' : '#f0f2f5',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 320, ...m, paddingTop: oy + 60, paddingBottom: 20, paddingLeft: 16, paddingRight: 16 }}>
        <h1
          style={{
            textAlign: 'center',
            fontSize: fs || '28px',
            fontWeight: (fw as React.CSSProperties['fontWeight']) || '600',
            color: fc || 'inherit',
            marginBottom: 24,
          }}
        >
          NocoBase
        </h1>
        <Card styles={{ body: { padding: 24 } }}>
          <Form layout="vertical" size="large">
            <Form.Item label={t('Account')}>
              <Input placeholder="admin@nocobase.com" disabled />
            </Form.Item>
            <Form.Item label={t('Password')}>
              <Input.Password placeholder="********" disabled />
            </Form.Item>
            <Button type="primary" htmlType="submit" block style={{ height: 40 }}>
              {t('Sign in')}
            </Button>
          </Form>
        </Card>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          width: '100%',
          textAlign: 'center',
          fontSize: 12,
          color: '#999',
        }}
      >
        Powered by NocoBase
      </div>
    </div>
  );
}

type Attachment = { id?: number; url?: string; filename?: string };

export default function LoginPageSettings() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm();
  const initRef = useRef(false);
  const [preview, setPreview] = useState<Record<string, unknown>>({});
  const [uploading, setUploading] = useState(false);

  const bgImage = Form.useWatch<Attachment | null>('loginBackgroundImage', form);

  const bgSizeOpts = useMemo(() => BG_SIZES.map((o) => ({ ...o, label: t(o.label) })), [t]);
  const bgRepeatOpts = useMemo(() => BG_REPEATS.map((o) => ({ ...o, label: t(o.label) })), [t]);
  const bgPosOpts = useMemo(() => BG_POSITIONS.map((o) => ({ ...o, label: t(o.label) })), [t]);

  const { loading } = useRequest(
    () =>
      ctx.api
        .request({
          url: 'systemEnhancementSettings:get/1',
          method: 'get',
          params: { appends: ['loginBackgroundImage'] },
        })
        .then((r) => r?.data?.data),
    {
      onSuccess(data) {
        if (!data) return;
        form.setFieldsValue(data);
        setPreview(data);
        initRef.current = true;
      },
      onError() {
        initRef.current = true;
      },
    },
  );

  const { run: save, loading: saving } = useRequest(
    (values: Record<string, unknown>) =>
      ctx.api.request({ url: 'systemEnhancementSettings:update/1', method: 'post', data: values }),
    {
      manual: true,
      onSuccess: () => message.success(t('Saved')),
      onError: () => message.error(t('Save failed')),
    },
  );

  async function handleSave() {
    const raw = form.getFieldsValue();
    const titleColor = raw.loginTitleColor;
    const payload: Record<string, unknown> = {
      loginBackgroundImage: raw.loginBackgroundImage || null,
      loginFormPosition: raw.loginFormPosition,
      loginFormOffsetX: raw.loginFormOffsetX,
      loginFormOffsetY: raw.loginFormOffsetY,
      loginTitleFontSize: raw.loginTitleFontSize ?? null,
      loginTitleFontWeight: raw.loginTitleFontWeight ?? null,
      loginTitleColor:
        typeof titleColor === 'string'
          ? titleColor
          : (titleColor as { toHexString?: () => string } | null)?.toHexString?.() ?? null,
      loginBackgroundSize: raw.loginBackgroundSize,
      loginBackgroundRepeat: raw.loginBackgroundRepeat,
      loginBackgroundPosition: raw.loginBackgroundPosition,
    };
    try {
      await save(payload);
      applyStyles(raw);
    } catch {
      /* error handled by onError */
    }
  }

  async function handleReset() {
    form.setFieldsValue({ ...DEFAULTS, loginBackgroundImage: undefined });
    setPreview(DEFAULTS);
    try {
      await save({ ...DEFAULTS, loginBackgroundImage: null });
      applyStyles(DEFAULTS);
    } catch {
      /* error handled by onError */
    }
  }

  const uploadProps: UploadProps = {
    showUploadList: false,
    accept: '.svg,.gif,.png,.jpg,.jpeg,.webp,.bmp,.ico',
    customRequest: async (options) => {
      const { file, onSuccess, onError } = options as {
        file: File;
        onSuccess?: (body: Record<string, unknown>) => void;
        onError?: (err: Error) => void;
      };
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await ctx.api.request({ url: 'attachments:create', method: 'post', data: fd });
        const att = res?.data?.data as Attachment;
        if (att) {
          form.setFieldValue('loginBackgroundImage', att);
          setPreview(form.getFieldsValue());
          onSuccess?.(att);
        }
      } catch (err) {
        message.error(t('Upload failed'));
        onError?.(err as Error);
      } finally {
        setUploading(false);
      }
    },
  };

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <Card title={t('Login Page Customization')} loading={loading} style={{ flex: '1 1 400px', minWidth: 360 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={DEFAULTS}
          onValuesChange={(_, all) => {
            if (initRef.current) setPreview(all);
          }}
        >
          <Card type="inner" title={t('Background Image')} size="small" style={{ marginBottom: 16 }}>
            <Form.Item name="loginBackgroundImage" label={null}>
              <Space direction="vertical">
                {bgImage?.url ? (
                  <img
                    alt="bg"
                    src={bgImage.url}
                    style={{
                      width: 200,
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 4,
                      border: '1px solid #d9d9d9',
                    }}
                  />
                ) : null}
                <Space>
                  <Upload {...uploadProps}>
                    <Button loading={uploading} icon={<UploadOutlined />}>
                      {t('Upload Background')}
                    </Button>
                  </Upload>
                  {bgImage ? (
                    <Button
                      onClick={() => {
                        form.setFieldValue('loginBackgroundImage', undefined);
                        setPreview(form.getFieldsValue());
                      }}
                    >
                      {t('Remove')}
                    </Button>
                  ) : null}
                </Space>
              </Space>
            </Form.Item>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              {t('Supported formats: SVG, GIF, PNG, JPG, WebP')}
            </div>
          </Card>

          <Card type="inner" title={t('Form Position')} size="small" style={{ marginBottom: 16 }}>
            <Form.Item name="loginFormPosition" label={t('Form Position')}>
              <Radio.Group>
                {POSITIONS.map((o) => (
                  <Radio.Button key={o.value} value={o.value}>
                    {t(o.label)}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>
            <Space>
              <Form.Item name="loginFormOffsetX" label={t('Horizontal Offset (px)')}>
                <InputNumber style={{ width: 160 }} min={-500} max={500} />
              </Form.Item>
              <Form.Item name="loginFormOffsetY" label={t('Vertical Offset (px)')}>
                <InputNumber style={{ width: 160 }} min={-500} max={500} />
              </Form.Item>
            </Space>
          </Card>

          <Card type="inner" title={t('Title Font Settings')} size="small" style={{ marginBottom: 16 }}>
            <Form.Item name="loginTitleFontSize" label={t('Font Size')}>
              <Select options={FONT_SIZES} allowClear placeholder={t('Default')} />
            </Form.Item>
            <Form.Item name="loginTitleFontWeight" label={t('Font Weight')}>
              <Select options={FONT_WEIGHTS} allowClear placeholder={t('Default')} />
            </Form.Item>
            <Form.Item
              name="loginTitleColor"
              label={t('Font Color')}
              getValueFromEvent={(c) => c?.toHexString?.() ?? c ?? null}
            >
              <ColorPicker format="hex" allowClear />
            </Form.Item>
          </Card>

          <Card type="inner" title={t('Background Settings')} size="small" style={{ marginBottom: 16 }}>
            <Form.Item name="loginBackgroundSize" label={t('Background Size')}>
              <Select options={bgSizeOpts} />
            </Form.Item>
            <Form.Item name="loginBackgroundRepeat" label={t('Background Repeat')}>
              <Select options={bgRepeatOpts} />
            </Form.Item>
            <Form.Item name="loginBackgroundPosition" label={t('Background Position')}>
              <Select options={bgPosOpts} />
            </Form.Item>
          </Card>

          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {t('Save')}
            </Button>
            <Button onClick={handleReset}>{t('Reset')}</Button>
          </Space>
        </Form>
      </Card>

      <Card title={t('Preview')} style={{ flex: '1 1 400px', minWidth: 360 }}>
        <LoginPagePreview values={preview} />
      </Card>
    </div>
  );
}
