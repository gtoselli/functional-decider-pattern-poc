import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../../@utils/decider';
import { clinicalDecider } from './index';
import type { State } from './types';

describe('clinicalDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, paths: [] } satisfies State;
  const aggregate = createDeciderAggregate(clinicalDecider, INITIAL_STATE);

  beforeEach(() => {
    aggregate.resetToInitialState();
  });

  it('start path', () => {
    const events = aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    expect(events).toEqual([
      {
        data: {
          id: expect.any(String),
          pathType: 'psychotherapy',
          startedAt: expect.any(Date),
        },
        type: 'PATH_STARTED',
      },
    ]);
  });

  it('add professional', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const path = aggregate.getState().paths[0];

    const events = aggregate.run({ type: 'ADD_PROFESSIONAL', data: { professionalId: 'pro-id', pathId: path.id } });
    expect(events).toEqual([
      {
        data: {
          addedAt: expect.any(Date),
          pathId: path.id,
          professionalId: 'pro-id',
        },
        type: 'PROFESSIONAL_ADDED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      id,
      paths: [
        {
          id: path.id,
          professionals: [
            {
              addedAt: expect.any(Date),
              id: 'pro-id',
            },
          ],
          sessions: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
        },
      ],
    });
  });

  it('admit session', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    const events = aggregate.run({
      type: 'ADMIT_SESSION',
      data: { id: 's1', startAt: new Date('2025-01-01'), pathId },
    });
    expect(events).toEqual([
      { data: { id: 's1', startAt: new Date('2025-01-01'), pathId }, type: 'SESSION_ADMITTED' },
      { data: { id: 's1', number: 1, startAt: new Date('2025-01-01'), pathId }, type: 'SESSION_CLASSIFIED' },
    ]);
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [{ id: 's1', number: 1, startAt: new Date('2025-01-01') }],
        },
      ],
      id,
    });
  });

  it('revoke session', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } });

    const events = aggregate.run({ type: 'REVOKE_SESSION', data: { id: 's1' } });
    expect(events).toEqual([{ data: { id: 's1', revokedAt: expect.any(Date), pathId }, type: 'SESSION_REVOKED' }]);
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [{ id: 's1', number: 1, startAt: new Date('2025-01-01'), revokedAt: expect.any(Date) }],
        },
      ],
      id,
    });
  });

  it('reassess session: same sequence', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } });
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's2', startAt: new Date('2025-01-03'), pathId } });

    const events = aggregate.run({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-02') } });
    expect(events).toEqual([
      {
        data: {
          id: 's1',
          number: 1,
          startAt: new Date('2025-01-02'),
          pathId,
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [
            { id: 's1', number: 1, startAt: new Date('2025-01-02') },
            { id: 's2', number: 2, startAt: new Date('2025-01-03') },
          ],
        },
      ],
      id,
    });
  });

  it('reassess session: sequence change', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } });
    aggregate.run({ type: 'ADMIT_SESSION', data: { id: 's2', startAt: new Date('2025-01-02'), pathId } });

    const events = aggregate.run({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-03') } });
    expect(events).toEqual([
      {
        data: {
          id: 's2',
          number: 1,
          startAt: new Date('2025-01-02'),
          pathId,
        },
        type: 'SESSION_CLASSIFIED',
      },
      {
        data: {
          id: 's1',
          number: 2,
          startAt: new Date('2025-01-03'),
          pathId,
        },
        type: 'SESSION_CLASSIFIED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [
            { id: 's1', number: 2, startAt: new Date('2025-01-03') },
            { id: 's2', number: 1, startAt: new Date('2025-01-02') },
          ],
        },
      ],
      id,
    });
  });
});
