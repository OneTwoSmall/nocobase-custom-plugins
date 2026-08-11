/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const DEFAULT_PASSWORD = 'ABCabc@123';
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function resolvePassword(value: string | undefined): string {
  if (!value || typeof value !== 'string' || !PASSWORD_REGEX.test(value)) {
    return DEFAULT_PASSWORD;
  }
  return value;
}
