/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import type { ComponentType } from 'react';
export type VerificationFormProps = {
    verifier: string;
    actionType: string;
    boundInfo?: {
        bound?: boolean;
        publicInfo?: any;
    };
    isLogged?: boolean;
};
export type BindFormProps = {
    verifier: string;
    actionType: string;
    isLogged?: boolean;
};
type LoaderOf<P = Record<string, never>> = () => Promise<{
    default: ComponentType<P>;
}>;
export type VerificationTypeOptions = {
    components: {
        AdminSettingsFormLoader?: LoaderOf;
        VerificationFormLoader?: LoaderOf<VerificationFormProps>;
        BindFormLoader?: LoaderOf<BindFormProps>;
    };
};
export declare class EmailOTPVerificationManager {
    verifications: Map<string, VerificationTypeOptions>;
    registerVerificationType(type: string, options: VerificationTypeOptions): void;
    getVerification(type: string): VerificationTypeOptions;
}
export {};
