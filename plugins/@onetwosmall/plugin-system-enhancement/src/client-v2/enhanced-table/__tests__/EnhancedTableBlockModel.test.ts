/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, type FlowModelContext } from '@nocobase/flow-engine';
import { EnhancedTableBlockModel } from '../EnhancedTableBlockModel';

describe('EnhancedTableBlockModel', () => {
  it('should register the enhancedTableSettings flow with a summaryConfig step', () => {
    const flow = EnhancedTableBlockModel.globalFlowRegistry.getFlow('enhancedTableSettings');
    expect(flow).toBeDefined();
    expect(flow?.key).toBe('enhancedTableSettings');
    expect(flow?.getStep('summaryConfig')).toBeDefined();
  });

  it('should be defined as a searchable content block model', async () => {
    const meta = EnhancedTableBlockModel.meta;
    expect(meta).toBeDefined();
    expect(meta?.label).toBeDefined();
    expect(meta?.group).toBeDefined();
    expect(meta?.searchable).toBe(true);
    expect(
      typeof meta?.createModelOptions === 'function'
        ? await meta.createModelOptions({} as FlowModelContext)
        : meta?.createModelOptions,
    ).toMatchObject({
      use: 'TableBlockModel',
    });
  });

  it('should override the native TableBlockModel registration so existing blocks resolve to the enhanced class', () => {
    const engine = new FlowEngine();
    engine.registerModels({ TableBlockModel: EnhancedTableBlockModel });
    expect(engine.getModelClass('TableBlockModel')).toBe(EnhancedTableBlockModel);
    expect(engine.getModelClass('TableBlockModel')?.name).toBe('TableBlockModel');
  });

  it('summaryConfig handler should persist only non-empty aggregations', async () => {
    const flow = EnhancedTableBlockModel.globalFlowRegistry.getFlow('enhancedTableSettings');
    const step = flow?.getStep('summaryConfig');
    expect(step).toBeDefined();
    const handler = step?.serialize().handler;
    expect(typeof handler).toBe('function');

    const setProps = vi.fn();
    const ctx = {
      model: { setProps },
    };

    await handler(ctx as any, {
      summaryConfig: { amount: 'sum', note: '', price: 'avg' },
    });

    expect(setProps).toHaveBeenCalledWith('summaryConfig', { amount: 'sum', price: 'avg' });
  });
});
