/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Plugin } from '@nocobase/client-v2';
import { EmailOTPProviderManager } from './email-otp-provider-manager';
/**
 * v2 entry for the Auth Email plugin. Mirrors the v1 surface
 * (`emailOTPProviderManager` instance exposed to downstream plugins) but
 * plugs into the v2 lifecycle.
 *
 * - Registers the `Email` auth type with the v2 auth plugin so v2 sign-in
 *   pages can display the email-OTP form.
 * - Registers the email-OTP verification type with the v2 verification
 *   plugin so verifiers of this type can be configured.
 * - The legacy `src/client/` entry is intentionally left in place so
 *   downstream v1-only plugins keep working until they migrate independently.
 */
export declare class PluginAuthEmailClientV2 extends Plugin {
    emailOTPProviderManager: EmailOTPProviderManager;
    load(): Promise<void>;
    private registerEmailAuthType;
    private registerEmailOTPVerification;
}
export default PluginAuthEmailClientV2;
