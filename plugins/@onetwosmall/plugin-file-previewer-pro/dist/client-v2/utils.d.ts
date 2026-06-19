/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
export interface FilePreviewerConfig {
    id?: string;
    previewType: 'microsoft' | 'kkfileview' | 'basemetas';
    kkFileViewUrl?: string;
    /** @deprecated use customExtensions instead */
    kkFileViewExtensions?: string;
    customExtensions?: string;
    basemetasUrl?: string;
}
export declare const getCachedConfig: () => FilePreviewerConfig;
export declare const setCachedConfig: (config: FilePreviewerConfig | null) => void;
/**
 * Minimal shape of a previewable file. Accepts the file-manager attachment record
 * or a bare URL string. All fields are optional so the helpers stay tolerant
 * of partial records coming from different call sites.
 */
export interface OfficePreviewFileObject {
    url?: string;
    mimetype?: string;
    extname?: string;
    name?: string;
    filename?: string;
    title?: string;
    size?: number;
}
export type OfficePreviewFile = string | OfficePreviewFileObject | null | undefined;
export declare const OFFICE_MIME_TYPES: string[];
export declare const OFFICE_EXTS: string[];
export declare const KKFILEVIEW_DEFAULT_EXTENSIONS: string[];
export declare const IMAGE_EXTS: string[];
export declare const getOfficeFileExt: (file: OfficePreviewFile) => string;
export declare const resolveFileUrl: (file: OfficePreviewFile) => string;
export declare const getOfficePreviewUrl: (file: OfficePreviewFile) => string;
export declare const isOfficeFile: (file: OfficePreviewFile) => boolean;
export declare const isImageOrPdf: (file: OfficePreviewFile) => boolean;
export declare const isPrivateNetwork: (hostname: string) => boolean;
export declare const safeBase64Encode: (str: string) => string;
export declare const getFileNameWithExt: (file: OfficePreviewFile) => string;
export declare const encodeUrlForKKFileView: (url: string) => string;
export declare const getAbsoluteFileUrl: (file: OfficePreviewFile) => string;
export declare const isMixedContent: (contentUrl: string) => boolean;
export interface PreviewWarning {
    messageKey: string;
    descriptionKey?: string;
    type: 'warning' | 'error';
}
export interface PreviewState {
    url: string;
    warnings: PreviewWarning[];
    iframeError: boolean;
}
/**
 * Core logic to determine preview URL and warnings for a given file and config.
 * Returns i18n keys so callers can translate in their own context.
 */
export declare const getPreviewState: (file: OfficePreviewFile, config: FilePreviewerConfig | null) => PreviewState;
/**
 * Determine whether a file should be previewed by this plugin,
 * based on the configured preview type and extension lists.
 */
export declare const shouldPreviewFile: (file: OfficePreviewFile, config: FilePreviewerConfig | null) => boolean;
