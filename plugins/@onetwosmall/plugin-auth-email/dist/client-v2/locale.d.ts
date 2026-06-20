/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
export declare const NAMESPACE = "@onetwosmall/plugin-auth-email";
export declare function useAuthEmailTranslation(): import("react-i18next").UseTranslationResponse<("client" | "@onetwosmall/plugin-auth-email")[], undefined>;
/**
 * v2-style translator. Routes through `flowEngine.context.t`, which natively
 * expands legacy Formily Schema templates (e.g. `{{t("Email")}}`) — useful
 * when the value comes from a server payload that still contains the
 * `{{t("…")}}` wrapper.
 */
export declare function useT(): (key: string) => string;
