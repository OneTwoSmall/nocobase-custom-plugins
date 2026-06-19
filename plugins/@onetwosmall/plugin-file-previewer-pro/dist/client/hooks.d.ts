/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { type FilePreviewerConfig, getCachedConfig, setCachedConfig } from '../client-v2/utils';
export type { FilePreviewerConfig };
export { getCachedConfig, setCachedConfig };
export declare const useFilePreviewerConfig: () => {
    config: FilePreviewerConfig;
    loading: boolean;
    refresh: () => void;
};
