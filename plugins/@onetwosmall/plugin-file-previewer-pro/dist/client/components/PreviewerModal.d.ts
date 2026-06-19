/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import React from 'react';
import { type OfficePreviewFile, type PreviewWarning } from '../../client-v2/utils';
export interface PreviewerModalProps {
    index: number | null;
    file: OfficePreviewFile;
    url: string;
    onSwitchIndex: (index: number | null) => void;
    title?: string;
    warnings?: PreviewWarning[];
    iframeError?: boolean;
    t?: (key: string) => string;
}
export declare const PreviewerModal: React.FC<PreviewerModalProps>;
