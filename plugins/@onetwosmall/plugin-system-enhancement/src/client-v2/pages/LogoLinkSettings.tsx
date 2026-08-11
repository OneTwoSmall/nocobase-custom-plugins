/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef, useState } from 'react';
import { Card, Form, Input, message } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';
import { applyLogoLink, isSafeRelativeUrl } from '../logoLinkInjector';

export default function LogoLinkSettings() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm();
  const initializedRef = useRef(false);
  const [invalid, setInvalid] = useState(false);

  const { loading } = useRequest(
    async () => {
      const res = await ctx.api.request({ url: 'systemEnhancementSettings:get/1', method: 'get' });
      return res?.data?.data;
    },
    {
      onSuccess(data) {
        if (data) {
          form.setFieldsValue({ logoLinkUrl: data.logoLinkUrl || '' });
          applyLogoLink(data.logoLinkUrl || '');
        }
        initializedRef.current = true;
      },
      onError() {
        initializedRef.current = true;
      },
    },
  );

  const { run: save, loading: saving } = useRequest(
    (values: any) => ctx.api.request({ url: 'systemEnhancementSettings:update/1', method: 'post', data: values }),
    {
      manual: true,
      onSuccess: () => message.success(t('Saved')),
      onError: () => message.error(t('Save failed')),
    },
  );

  return (
    <Card title={t('Logo Link')} loading={loading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ logoLinkUrl: '' }}
        onValuesChange={(_, values) => {
          if (!initializedRef.current) {
            return;
          }
          const url = (values.logoLinkUrl as string) || '';
          if (!isSafeRelativeUrl(url)) {
            setInvalid(true);
            return;
          }
          setInvalid(false);
          applyLogoLink(url);
          save(values);
        }}
      >
        <Form.Item
          name="logoLinkUrl"
          label={t('Logo Link URL')}
          validateStatus={invalid ? 'error' : undefined}
          help={invalid ? t('Only relative paths within the current system are allowed') : t('Logo Link URL help')}
        >
          <Input
            disabled={saving}
            placeholder="/your/path"
            status={invalid ? 'error' : undefined}
            onBlur={() => setInvalid(false)}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
