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
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';
import { setTableColumnResizeEnabled } from '../plugin';

export default function TableEnhancementSettings() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm();
  const initializedRef = useRef(false);

  const { loading } = useRequest(
    async () => {
      const res = await ctx.api.request({ url: 'systemEnhancementSettings:get/1', method: 'get' });
      return res?.data?.data;
    },
    {
      onSuccess(data) {
        if (data) {
          form.setFieldsValue(data);
          setTableColumnResizeEnabled(data.enableTableColumnResize !== false);
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
    <Card title={t('Table Enhancement')} loading={loading}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ enableTableColumnResize: true }}
        onValuesChange={(_, values) => {
          if (initializedRef.current) {
            setTableColumnResizeEnabled(values.enableTableColumnResize);
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
