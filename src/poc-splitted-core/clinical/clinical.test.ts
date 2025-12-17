import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { clinicalDecider } from './index';
import type { State } from './types';

describe('clinicalDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, sessions: [] } satisfies State;
  const aggregate = createDeciderAggregate(clinicalDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('classify session', () => {
    const events = aggregate.run({ type: 'CLASSIFY_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });

    expect(events).toEqual([
      {
        data: {
          id: 's1',
          number: 1,
          startAt: new Date('2025-01-01'),
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      sessions: [
        {
          id: 's1',
          number: 1,
          startAt: new Date('2025-01-01'),
        },
      ],
      id,
    });
  });

  it('classify session: after existing', () => {
    aggregate.run({ type: 'CLASSIFY_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });

    const events = aggregate.run({ type: 'CLASSIFY_SESSION', data: { id: 's2', startAt: new Date('2025-01-02') } });

    expect(events).toEqual([
      {
        data: {
          id: 's2',
          number: 2,
          startAt: new Date('2025-01-02'),
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      sessions: [
        {
          id: 's1',
          number: 1,
          startAt: new Date('2025-01-01'),
        },
        {
          id: 's2',
          number: 2,
          startAt: new Date('2025-01-02'),
        },
      ],
      id,
    });
  });

  it('classify session: before existing', () => {
    aggregate.run({ type: 'CLASSIFY_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });

    const events = aggregate.run({ type: 'CLASSIFY_SESSION', data: { id: 's2', startAt: new Date('2024-12-31') } });

    expect(events).toEqual([
      {
        data: {
          id: 's2',
          number: 1,
          startAt: new Date('2024-12-31'),
        },
        type: 'SESSION_CLASSIFIED',
      },
      {
        data: {
          id: 's1',
          number: 2,
          startAt: new Date('2025-01-01'),
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      sessions: [
        {
          id: 's1',
          number: 2,
          startAt: new Date('2025-01-01'),
        },
        {
          id: 's2',
          number: 1,
          startAt: new Date('2024-12-31'),
        },
      ],
      id,
    });
  });
});
