/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useT } from './locale';

export const Options = () => {
  const t = useT();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          seeyon: {
            type: 'void',
            properties: {
              public: {
                type: 'object',
                properties: {
                  oaHost: {
                    type: 'string',
                    title: '{{t("OA Host")}}',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: 'http://127.0.0.1',
                    },
                  },
                  autoRegister: {
                    'x-decorator': 'FormItem',
                    type: 'boolean',
                    title: '{{t("Sign up automatically when the user does not exist")}}',
                    'x-component': 'Checkbox',
                  },
                  matchField: {
                    type: 'string',
                    title: '{{t("User Match Field")}}',
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                    'x-component-props': {
                      options: [
                        { label: '{{t("Username")}}', value: 'username' },
                        { label: '{{t("Email")}}', value: 'email' },
                        { label: '{{t("Nickname")}}', value: 'nickname' },
                      ],
                    },
                    default: 'username',
                  },
                  defaultPassword: {
                    type: 'string',
                    title: '{{t("Default Password")}}',
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {
                      placeholder: 'ABCabc@123',
                    },
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};
