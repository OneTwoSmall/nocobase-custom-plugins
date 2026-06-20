/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { InstallOptions, Plugin } from '@nocobase/server';
import { EmailOTPProviderManager } from './email-otp';
import { Counter } from '@nocobase/cache';
export declare class PluginAuthEmailServer extends Plugin {
    emailOTPProviderManager: EmailOTPProviderManager;
    emailOTPCounter: Counter;
    afterAdd(): void;
    load(): Promise<void>;
    install(options?: InstallOptions): Promise<void>;
    afterEnable(): Promise<void>;
    afterDisable(): Promise<void>;
    remove(): Promise<void>;
}
export default PluginAuthEmailServer;
