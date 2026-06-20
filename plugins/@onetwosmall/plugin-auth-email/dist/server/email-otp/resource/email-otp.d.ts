/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Context, Next } from '@nocobase/actions';
declare function create(ctx: Context, next: Next): Promise<any>;
declare const _default: {
    name: string;
    actions: {
        create: typeof create;
        publicCreate: typeof create;
    };
};
export default _default;
