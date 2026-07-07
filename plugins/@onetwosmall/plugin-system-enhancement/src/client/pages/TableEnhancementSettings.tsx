/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useRef } from 'react';
import { Card, Form, Switch, Space, message } from 'antd';
import { useAPIClient, useRequest } from '@nocobase/client';
import { useT } from '../locale';

export default function TableEnhancementSettings() {
  const api = useAPIClient();
  const t = useT();
  const [form] = Form.useForm();
  const initializedRef = useRef(false);

  const { loading } = useRequest<{ data: any }>(
    { url: 'systemEnhancementSettings:get/1', method: 'get' },
    {
      onSuccess(response) {
        const data = response?.data?.data;
        if (data) {
          form.setFieldsValue(data);
          initializedRef.current = true;
        }
      },
      onError() {
        initializedRef.current = true;
      },
    },
  );

  const { run: save, loading: saving } = useRequest(
    (values: any) => api.request({ url: 'systemEnhancementSettings:update/1', method: 'post', data: values }),
    {
      manual: true,
      onSuccess: () => message.success(t('Saved')),
      onError: () => message.error(t('Save failed')),
    },
  );

  return (
    <Card title={t('Table Enhancement')} loading={loading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ enableTableColumnResize: true }}
        onValuesChange={(_, values) => {
          if (initializedRef.current) {
            save(values);
          }
        }}
      >
        <Space>
          <span>{t('Enable table column drag resize')}</span>
          <Form.Item name="enableTableColumnResize" valuePropName="checked" noStyle>
            <Switch disabled={saving} />
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}
