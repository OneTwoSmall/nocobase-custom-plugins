/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Registry } from '@nocobase/utils';
import { Verification } from '@nocobase/plugin-verification';
import { Context } from '@nocobase/actions';
import { Model } from '@nocobase/database';
import { EmailProvider } from './providers';
type EmailProviderOptions = {
    title: string;
    provider: typeof EmailProvider;
};
export declare class EmailOTPProviderManager {
    providers: Registry<EmailProviderOptions>;
    registerProvider(type: string, options: EmailProviderOptions): void;
    listProviders(): {
        name: string;
        title: string;
    }[];
}
export declare class EmailOTPVerification extends Verification {
    getBoundInfo(userId: number): Promise<any>;
    codeLength: number;
    codeType: string;
    expiresIn: number;
    resendInterval: number;
    maxVerifyAttempts: number;
    constructor(props: {
        ctx: Context;
        verifier: Model;
        options: Record<string, any>;
    });
    verify({ resource, action, boundInfo, verifyParams }: {
        resource: any;
        action: any;
        boundInfo: any;
        verifyParams: any;
    }): Promise<any>;
    bind(userId: number, resource?: string, action?: string): Promise<{
        uuid: string;
        meta?: any;
    }>;
    onActionComplete({ verifyResult }: {
        verifyResult: any;
    }): Promise<void>;
    generateCode(): string;
    getProvider(): Promise<any>;
    getPublicBoundInfo(userId: number): Promise<{
        bound: boolean;
        publicInfo?: undefined;
    } | {
        bound: boolean;
        publicInfo: string;
    }>;
    validateBoundInfo({ uuid: email }: {
        uuid: any;
    }): Promise<boolean>;
}
export {};
