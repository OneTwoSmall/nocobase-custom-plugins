/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getBackgroundUrl, setApiBaseUrl } from '../loginPageStyleInjector';

describe('getBackgroundUrl', () => {
  it('should build the public endpoint url from loginBackgroundImageId', () => {
    setApiBaseUrl('/api/');
    expect(getBackgroundUrl({ loginBackgroundImageId: 20 })).toBe(
      '/api/systemEnhancementSettings:getLoginBackgroundImage?v=20',
    );
  });

  it('should fall back to the attachment id when only the relation object is available', () => {
    setApiBaseUrl('/api');
    expect(getBackgroundUrl({ loginBackgroundImage: { id: 7 } })).toBe(
      '/api/systemEnhancementSettings:getLoginBackgroundImage?v=7',
    );
  });

  it('should return an empty string when no background image is configured', () => {
    setApiBaseUrl('/api/');
    expect(getBackgroundUrl({})).toBe('');
    expect(getBackgroundUrl({ loginBackgroundImage: null })).toBe('');
  });
});
