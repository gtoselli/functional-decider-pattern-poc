import { expect } from 'vitest';

type Result<T, ER = string> = { success: true; value: T } | { success: false; reason: ER };

export function succeed<T>(value?: T): { success: true; value: T } {
  return { success: true, value: value as T };
}

export function fail<ER>(reason: ER): { reason: ER; success: false } {
  return { reason, success: false };
}

export function expectSuccess<T, ER>(result: Result<T, ER>): asserts result is { success: true; value: T } {
  expect(result.success).toBe(true);
}

export function expectFailure<T, ER>(
  result: Result<T, ER>,
  expectedReason?: ER,
): asserts result is { reason: ER; success: false } {
  expect(result.success).toBe(false);
  if (expectedReason !== undefined && !result.success) {
    expect(result.reason).toBe(expectedReason);
  }
}
