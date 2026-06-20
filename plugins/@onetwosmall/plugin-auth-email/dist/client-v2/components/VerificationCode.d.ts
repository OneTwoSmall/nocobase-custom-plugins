/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
export interface VerificationCodeProps {
    /** Persisted OTP value. Controlled by the parent `Form.Item`. */
    value?: string;
    onChange?: (next: string) => void;
    /**
     * Server-side action the OTP grants (e.g. `auth:signIn:email`,
     * `verifiers:bind`). Forwarded to the `emailOTP:*` endpoint so the
     * OTP is bound to a specific action.
     */
    actionType: string;
    /** Verifier name (a row in the `verifiers` collection). */
    verifier: string;
    /**
     * The email address the OTP is sent to. Parent reads it via
     * `Form.useWatch('uuid', form)` and forwards it here. Required at send
     * time — the send button is disabled until it has a value.
     */
    email?: string;
    /**
     * Whether the user is already signed in. Drives the choice between
     * `emailOTP:create` (logged-in) and `emailOTP:publicCreate` (anonymous).
     * Defaults to `false` (anonymous).
     */
    isLogged?: boolean;
    disabled?: boolean;
    placeholder?: string;
}
/**
 * Verification-code input + "Send code / Retry in N s" button pair.
 *
 * v2 rewrite of v1's `VerificationCode`:
 * - No `withDynamicSchemaProps`, no `@formily/react` `useForm()` —
 *   the parent owns the email value via `Form.useWatch` and passes it
 *   in as a prop.
 * - Countdown starts from the server-reported `expiresAt` so the UI
 *   tracks the same window the server enforces.
 * - Clearing the code on resend matches v1 behaviour so the user has
 *   to type the new code rather than reusing the stale one.
 */
export declare function VerificationCode(props: VerificationCodeProps): React.JSX.Element;
export default VerificationCode;
