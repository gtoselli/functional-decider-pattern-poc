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

  it('admit session', () => {
    const events = aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });
    expect(events).toEqual([
      { data: { id: 's1', startAt: new Date('2025-01-01') }, type: 'SESSION_ADMITTED' },
      { data: { id: 's1', number: 1, startAt: new Date('2025-01-01') }, type: 'SESSION_CLASSIFIED' },
    ]);
    expect(aggregate.getState()).toEqual({ sessions: [{ id: 's1', number: 1, startAt: new Date('2025-01-01') }], id });
  });

  it('revoke session', () => {
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });

    const events = aggregate.run({ type: 'REVOKE_SESSION', data: { id: 's1' } });
    expect(events).toEqual([{ data: { id: 's1', revokedAt: expect.any(Date) }, type: 'SESSION_REVOKED' }]);
    expect(aggregate.getState()).toEqual({
      sessions: [{ id: 's1', number: 1, startAt: new Date('2025-01-01'), revokedAt: expect.any(Date) }],
      id,
    });
  });

  it('reassess session: same sequence', () => {
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's2', startAt: new Date('2025-01-03') } });

    const events = aggregate.run({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-02') } });
    expect(events).toEqual([
      {
        data: {
          id: 's1',
          number: 1,
          startAt: new Date('2025-01-02'),
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      sessions: [
        { id: 's1', number: 1, startAt: new Date('2025-01-02') },
        { id: 's2', number: 2, startAt: new Date('2025-01-03') },
      ],
      id,
    });
  });

  it('reassess session: sequence change', () => {
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01') } });
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's2', startAt: new Date('2025-01-02') } });

    const events = aggregate.run({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-03') } });
    expect(events).toEqual([
      {
        data: {
          id: 's2',
          number: 1,
          startAt: new Date('2025-01-02'),
        },
        type: 'SESSION_CLASSIFIED',
      },
      {
        data: {
          id: 's1',
          number: 2,
          startAt: new Date('2025-01-03'),
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      sessions: [
        { id: 's1', number: 2, startAt: new Date('2025-01-03') },
        { id: 's2', number: 1, startAt: new Date('2025-01-02') },
      ],
      id,
    });
  });
});
