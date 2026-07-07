/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useApp } from '@nocobase/client';
import { useCallback } from 'react';
import { NAMESPACE } from './constants';

export function useT() {
  const app = useApp() as any;
  return useCallback((str: string) => app.i18n.t(str, { ns: [NAMESPACE, 'client'] }), [app]);
}
