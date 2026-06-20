/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
/// <reference types="react" />
export type { BindFormProps } from './BindForm';
export type { VerificationFormProps } from './VerificationForm';
export declare const emailOTPVerificationOptions: {
    components: {
        VerificationForm: (props: import("./VerificationForm").VerificationFormProps) => import("react").JSX.Element;
        AdminSettingsForm: import("react").FC<{}>;
        BindForm: (props: import("./BindForm").BindFormProps) => import("react").JSX.Element;
    };
};
