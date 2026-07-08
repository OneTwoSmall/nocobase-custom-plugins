/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'systemEnhancementSettings',
  fields: [
    { name: 'enableTableColumnResize', type: 'boolean', defaultValue: true },
    {
      name: 'loginBackgroundImage',
      type: 'belongsTo',
      target: 'attachments',
    },
    { name: 'loginFormPosition', type: 'string', defaultValue: 'center' },
    { name: 'loginFormOffsetX', type: 'integer', defaultValue: 0 },
    { name: 'loginFormOffsetY', type: 'integer', defaultValue: 0 },
    { name: 'loginTitleFontSize', type: 'string' },
    { name: 'loginTitleFontWeight', type: 'string' },
    { name: 'loginTitleColor', type: 'string' },
    { name: 'loginBackgroundSize', type: 'string', defaultValue: 'cover' },
    { name: 'loginBackgroundRepeat', type: 'string', defaultValue: 'no-repeat' },
    { name: 'loginBackgroundPosition', type: 'string', defaultValue: 'center' },
  ],
});
