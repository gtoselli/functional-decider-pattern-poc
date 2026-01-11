import { describe, expect, it } from 'vitest';
import { decide } from './decide';
import { evolve } from './evolve';
import type { State } from './types';

describe('clinicalDecider', () => {
  const id = 'foo-patient-id';
  const INITIAL_STATE = { id, paths: [] } satisfies State;

  it('start path', () => {
    const events = decide({ type: 'START_PATH', data: { pathType: 'psychotherapy' } }, INITIAL_STATE);
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
    let state: State = INITIAL_STATE;
    state = decide({ type: 'START_PATH', data: { pathType: 'psychotherapy' } }, state).reduce(evolve, state);
    const path = state.paths[0];

    const events = decide(
      {
        type: 'ADD_PROFESSIONAL',
        data: { professionalId: 'pro-id', pathId: path.id, role: 'professional' },
      },
      state,
    );
    state = events.reduce(evolve, state);
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
    expect(state).toEqual({
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
      decide(
        {
          type: 'ADD_PROFESSIONAL',
          data: { professionalId: 'pro-id', pathId: path.id, role: 'professional' },
        },
        state,
      ),
    ).toThrow('Professional already in the path');

    expect(() =>
      decide(
        {
          type: 'ADD_PROFESSIONAL',
          data: { professionalId: 'pro-id-1', pathId: path.id, role: 'professional' },
        },
        state,
      ),
    ).toThrow('Professional role already in the path');

    state = decide({ type: 'START_PATH', data: { pathType: 'wlm' } }, state).reduce(evolve, state);

    const wlmPath = state.paths[1];
    expect(() =>
      decide(
        {
          type: 'ADD_PROFESSIONAL',
          data: { professionalId: 'pro-id', pathId: wlmPath.id, role: 'professional' },
        },
        state,
      ),
    ).toThrow('Role not allowed for path');
  });

  it('add session', () => {
    let state: State = INITIAL_STATE;
    state = decide({ type: 'START_PATH', data: { pathType: 'psychotherapy' } }, state).reduce(evolve, state);
    const pathId = state.paths[0].id;

    const events = decide(
      {
        type: 'ADD_SESSION',
        data: { id: 's1', startAt: new Date('2025-01-01'), pathId },
      },
      state,
    );
    expect(events).toEqual([
      { data: { id: 's1', startAt: new Date('2025-01-01'), pathId }, type: 'SESSION_ADDED' },
      {
        data: { id: pathId, sessions: [{ id: 's1', number: 1 }] },
        type: 'PATH_SEQUENCE_CHANGED',
      },
    ]);
    expect(events.reduce(evolve, state)).toEqual({
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

  it('remove session', () => {
    let state: State = INITIAL_STATE;
    state = decide({ type: 'START_PATH', data: { pathType: 'psychotherapy' } }, state).reduce(evolve, state);
    const pathId = state.paths[0].id;

    state = decide({ type: 'ADD_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } }, state).reduce(
      evolve,
      state,
    );

    const events = decide({ type: 'REMOVE_SESSION', data: { id: 's1', reason: 'cancelled' } }, state);
    expect(events).toEqual([
      { data: { id: 's1', removedAt: expect.any(Date), pathId, reason: 'cancelled' }, type: 'SESSION_REMOVED' },
    ]);
    expect(events.reduce(evolve, state)).toEqual({
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
    let state: State = INITIAL_STATE;
    state = decide({ type: 'START_PATH', data: { pathType: 'psychotherapy' } }, state).reduce(evolve, state);
    const pathId = state.paths[0].id;

    state = decide({ type: 'ADD_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } }, state).reduce(
      evolve,
      state,
    );
    state = decide({ type: 'ADD_SESSION', data: { id: 's2', startAt: new Date('2025-01-03'), pathId } }, state).reduce(
      evolve,
      state,
    );

    const events = decide({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-02') } }, state);
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
    expect(events.reduce(evolve, state)).toEqual({
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
    let state: State = INITIAL_STATE;
    state = decide({ type: 'START_PATH', data: { pathType: 'psychotherapy' } }, state).reduce(evolve, state);
    const pathId = state.paths[0].id;

    state = decide({ type: 'ADD_SESSION', data: { id: 's1', startAt: new Date('2025-01-01'), pathId } }, state).reduce(
      evolve,
      state,
    );
    state = decide({ type: 'ADD_SESSION', data: { id: 's2', startAt: new Date('2025-01-02'), pathId } }, state).reduce(
      evolve,
      state,
    );

    const events = decide({ type: 'REASSESS_SESSION', data: { id: 's1', startAt: new Date('2025-01-03') } }, state);
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

    expect(events.reduce(evolve, state)).toEqual({
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
