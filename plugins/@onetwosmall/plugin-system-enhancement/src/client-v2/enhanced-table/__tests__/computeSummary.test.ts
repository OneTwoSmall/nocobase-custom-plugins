/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { computeAggregation, computeSummaryRow, getNumericValues, isNumericField } from '../tableDomEnhancer';

describe('isNumericField', () => {
  it('should detect numeric fields by type or interface', () => {
    expect(isNumericField({ type: 'integer' })).toBe(true);
    expect(isNumericField({ type: 'double' })).toBe(true);
    expect(isNumericField({ type: 'string' })).toBe(false);
    expect(isNumericField({ type: 'string', interface: 'currency' })).toBe(true);
    expect(isNumericField({ type: 'string', interface: 'checkbox' })).toBe(false);
  });
});

describe('getNumericValues', () => {
  it('should collect numeric values and filter out non-numeric ones', () => {
    const rows = [
      { price: 10, note: 'a' },
      { price: '20.5', note: 'b' },
      { price: null, note: 'c' },
      { price: undefined, note: 'd' },
      { price: 'not-a-number', note: 'e' },
    ];
    expect(getNumericValues(rows, 'price')).toEqual([10, 20.5]);
    expect(getNumericValues(rows, 'note')).toEqual([]);
  });
});

describe('computeAggregation', () => {
  const values = [10, 20.5, 3];

  it('should compute sum', () => {
    expect(computeAggregation(values, 'sum')).toBe(33.5);
  });

  it('should compute average rounded to 2 decimals', () => {
    expect(computeAggregation(values, 'avg')).toBe(11.17);
  });

  it('should compute count', () => {
    expect(computeAggregation(values, 'count')).toBe(3);
  });

  it('should compute min and max', () => {
    expect(computeAggregation(values, 'min')).toBe(3);
    expect(computeAggregation(values, 'max')).toBe(20.5);
  });

  it('should return empty string for empty values', () => {
    expect(computeAggregation([], 'sum')).toBe('');
  });
});

describe('computeSummaryRow', () => {
  it('should compute aggregations for configured columns', () => {
    const rows = [
      { amount: 100, count: 1 },
      { amount: 50, count: 2 },
      { amount: 25, count: 3 },
    ];
    const result = computeSummaryRow(rows, { amount: 'sum', count: 'avg' });
    expect(result.amount).toBe(175);
    expect(result.count).toBe(2);
  });
});
