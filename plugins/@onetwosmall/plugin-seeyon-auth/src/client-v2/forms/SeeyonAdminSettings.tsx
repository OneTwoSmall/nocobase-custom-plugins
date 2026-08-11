/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Form, Input, Switch, Select } from 'antd';
import React from 'react';
import { useT } from '../../client/locale';

export default function SeeyonAdminSettings() {
  const t = useT();

  return (
    <>
      <Form.Item
        name={['options', 'public', 'oaHost']}
        label={t('OA Host')}
        rules={[{ required: true, message: t('Please enter the OA server address') }]}
      >
        <Input placeholder="http://127.0.0.1" />
      </Form.Item>
      <Form.Item
        name={['options', 'public', 'autoRegister']}
        label={t('Sign up automatically when the user does not exist')}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
      <Form.Item name={['options', 'public', 'matchField']} label={t('User Match Field')} initialValue="username">
        <Select
          options={[
            { label: t('Username'), value: 'username' },
            { label: t('Email'), value: 'email' },
            { label: t('Nickname'), value: 'nickname' },
          ]}
        />
      </Form.Item>
      <Form.Item name={['options', 'public', 'defaultPassword']} label={t('Default Password')}>
        <Input placeholder="ABCabc@123" />
      </Form.Item>
    </>
  );
}
