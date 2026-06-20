/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { type Authenticator } from '@nocobase/plugin-auth/client-v2';
/**
 * Email OTP sign-in form for v2 client.
 *
 * Similar to v1's `SigninPage` but uses antd `Form` directly instead of
 * `@formily/react` `SchemaComponent`. The VerificationForm component is
 * resolved from the verification plugin's v2 verification manager at runtime.
 */
export default function EmailSignInForm({ authenticator }: {
    authenticator: Authenticator;
}): React.JSX.Element;
