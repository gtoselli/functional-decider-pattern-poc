import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderAggregate } from '../@utils/decider';
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

    const events = aggregate.run({
      type: 'ADD_PROFESSIONAL',
      data: { professionalId: 'pro-id', pathId: path.id, role: 'professional' },
    });
    expect(events).toEqual([
      {
        data: {
          addedAt: expect.any(Date),
          pathId: path.id,
          professionalId: 'pro-id',
          role: 'professional',
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
              role: 'professional',
            },
          ],
          sessions: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
        },
      ],
    });

    expect(() =>
      aggregate.run({
        type: 'ADD_PROFESSIONAL',
        data: { professionalId: 'pro-id', pathId: path.id, role: 'professional' },
      }),
    ).toThrow('Professional already in the path');

    expect(() =>
      aggregate.run({
        type: 'ADD_PROFESSIONAL',
        data: { professionalId: 'pro-id-1', pathId: path.id, role: 'professional' },
      }),
    ).toThrow('Professional role already in the path');

    aggregate.run({ type: 'START_PATH', data: { pathType: 'wlm' } });
    const wlmPath = aggregate.getState().paths[1];
    expect(() =>
      aggregate.run({
        type: 'ADD_PROFESSIONAL',
        data: { professionalId: 'pro-id', pathId: wlmPath.id, role: 'professional' },
      }),
    ).toThrow('Role not allowed for path');
  });

  it('add session', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    const events = aggregate.run({
      type: 'ADD_SESSION',
      data: { id: 's1', startAt: new Date('2025-01-01'), pathId },
    });
    expect(events).toEqual([
      { data: { id: 's1', startAt: new Date('2025-01-01'), pathId }, type: 'SESSION_ADDED' },
      {
        data: { id: pathId, sessions: [{ id: 's1', number: 1 }] },
        type: 'PATH_SEQUENCE_CHANGED',
      },
    ]);
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [{ id: 's1', number: 1, startAt: new Date('2025-01-01'), removedAt: null, removalReason: null }],
        },
      ],
      id,
    });
  });

  it('revoke session', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    aggregate.run({ type: 'ADD_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } });

    const events = aggregate.run({ type: 'REMOVE_SESSION', data: { id: 's1', reason: 'cancelled' } });
    expect(events).toEqual([
      { data: { id: 's1', removedAt: expect.any(Date), pathId, reason: 'cancelled' }, type: 'SESSION_REMOVED' },
    ]);
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [
            {
              id: 's1',
              number: 1,
              startAt: new Date('2025-01-01'),
              removedAt: expect.any(Date),
              removalReason: 'cancelled',
            },
          ],
        },
      ],
      id,
    });
  });

  it('reassess session: same sequence', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    aggregate.run({ type: 'ADD_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } });
    aggregate.run({ type: 'ADD_SESSION', data: { id: 's2', startAt: new Date('2025-01-03'), pathId } });

    const events = aggregate.run({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-02') } });
    expect(events).toEqual(
      expect.arrayContaining([
        {
          data: {
            id: pathId,
            sessions: [
              { id: 's1', number: 1 },
              { id: 's2', number: 2 },
            ],
          },
          type: 'PATH_SEQUENCE_CHANGED',
        },
      ]),
    );
    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [
            { id: 's1', number: 1, startAt: new Date('2025-01-02'), removedAt: null, removalReason: null },
            { id: 's2', number: 2, startAt: new Date('2025-01-03'), removedAt: null, removalReason: null },
          ],
        },
      ],
      id,
    });
  });

  it('reassess session: sequence change', () => {
    aggregate.run({ type: 'START_PATH', data: { pathType: 'psychotherapy' } });
    const pathId = aggregate.getState().paths[0].id;

    aggregate.run({ type: 'ADD_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } });
    aggregate.run({ type: 'ADD_SESSION', data: { id: 's2', startAt: new Date('2025-01-02'), pathId } });

    const events = aggregate.run({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-03') } });
    expect(events).toEqual(
      expect.arrayContaining([
        {
          data: {
            id: pathId,
            sessions: [
              { id: 's2', number: 1 },
              { id: 's1', number: 2 },
            ],
          },
          type: 'PATH_SEQUENCE_CHANGED',
        },
      ]),
    );

    expect(aggregate.getState()).toEqual({
      paths: [
        {
          id: pathId,
          professionals: [],
          startedAt: expect.any(Date),
          type: 'psychotherapy',
          sessions: [
            { id: 's1', number: 2, startAt: new Date('2025-01-03'), removedAt: null, removalReason: null },
            { id: 's2', number: 1, startAt: new Date('2025-01-02'), removedAt: null, removalReason: null },
          ],
        },
      ],
      id,
    });
  });
});
