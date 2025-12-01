import { describe, expect, it } from 'vitest';
import { clearNulls } from '../clear-nulls';

describe('clearNulls', () => {
  it('returns empty object for non-object or array inputs', () => {
    expect(clearNulls('demo test string')).toEqual({});
    expect(clearNulls([])).toEqual({});
    expect(clearNulls([1, 2, null])).toEqual({});
  });

  it('returns the same object when there are no null values (fast path)', () => {
    const obj = { a: 1, b: 'ok', c: false };
    const result = clearNulls(obj);
    expect(result).toBe(obj);
    expect(result).toEqual(obj);
  });

  it('drops only null properties and clones when needed', () => {
    const obj = { a: 5, b: null, c: 7, d: null };
    const result = clearNulls(obj);
    expect(result).toEqual({ a: 5, c: 7 });
    expect(result).not.toBe(obj);
  });
});
