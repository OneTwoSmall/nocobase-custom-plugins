/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import type { VerificationFormProps } from '../verification-manager';
/**
 * Email-OTP verify form: email address (read-only when bound) + verification
 * code field paired with a "send code" button. Hosted inside a parent
 * `<Form>` — antd Form.Item paths land on `uuid` (email) and `code`,
 * matching the v1 schema so server-side handlers are unchanged.
 */
export declare function VerificationForm(props: VerificationFormProps): React.JSX.Element;
export default VerificationForm;
