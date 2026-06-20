/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import type { BindFormProps } from '../verification-manager';
/**
 * Email-OTP bind form. Same shape as `VerificationForm` minus the bound
 * publicInfo path — when binding, the user is always typing in a new
 * email address. Hosted inside the parent `<Form>` so `uuid` / `code`
 * land on the parent's `form.values`.
 */
export declare function BindForm(props: BindFormProps): React.JSX.Element;
export default BindForm;
