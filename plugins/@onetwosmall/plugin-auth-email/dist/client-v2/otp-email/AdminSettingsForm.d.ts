/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
/**
 * Admin settings form for an Email-OTP verifier:
 * 1. Code configuration fields (length, type, expiry, resend interval).
 * 2. `options.provider` selects which configured email provider (SMTP / …)
 *    sends the OTP. The list is the server resource `emailOTPProviders:list`.
 * 3. `options.settings.*` is the provider-specific configuration form,
 *    looked up from the plugin's `emailOTPProviderManager` at runtime.
 */
export declare function AdminSettingsForm(): React.JSX.Element;
export default AdminSettingsForm;
