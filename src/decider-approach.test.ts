import { beforeEach, describe, expect, it } from 'vitest';
import { createDeciderRunner } from './@utils/decider';
import { decider } from './decider-approach';

describe('decider approach', () => {
  const INITIAL_STATE = {
    id: 'foo-id',
    paths: [],
  };
  const runner = createDeciderRunner(decider, INITIAL_STATE);

  beforeEach(() => {
    runner.reset();
  });

  describe('Given a patient with no paths', () => {
    it('When start, should add a new path', () => {
      runner.run({
        data: {
          professionalId: 'nt-id',
          professionalRole: 'nutritionist',
          type: 'wlm',
        },
        type: 'START_PATH',
      });

      expect(runner.getState().paths).toHaveLength(1);
      expect(runner.getState().paths[0]).toMatchObject({
        id: expect.any(String),
        professionals: [{ id: 'nt-id', role: 'nutritionist' }],
        type: 'wlm',
      });
    });
  });
  describe('Given a patient with an active wlm path', () => {
    beforeEach(() => {
      runner.run({
        data: {
          professionalId: 'nt-id',
          professionalRole: 'nutritionist',
          type: 'wlm',
        },
        type: 'START_PATH',
      });
    });

    it('When start with same path, should fail', () => {
      expect(() =>
        runner.run({
          data: {
            professionalId: 'nt-id',
            professionalRole: 'nutritionist',
            type: 'wlm',
          },
          type: 'START_PATH',
        }),
      ).toThrowError('Path already exists');
    });

    it('When scheduleSessions, should schedule a session of 60 mins', () => {
      runner.run({
        data: {
          pathType: 'wlm',
          starAt: new Date('2025-12-01'),
        },
        type: 'SCHEDULE_SESSION',
      });

      expect(runner.getState()['paths'][0].sessions).toHaveLength(1);
      expect(runner.getState()['paths'][0].sessions[0]).toMatchObject({
        duration: 60,
        id: expect.any(String),
        startAt: new Date('2025-12-01'),
        sequence: 1,
      });
    });

    it('When addAnotherProfessional with dietitian role, should add the professional', () => {
      runner.run({
        data: {
          pathType: 'wlm',
          professionalId: 'di-id',
          professionalRole: 'dietitian',
        },
        type: 'ADD_ANOTHER_PROFESSIONAL',
      });

      expect(runner.getState()['paths'][0].professionals).toHaveLength(2);
      expect(runner.getState()['paths'][0].professionals[1]).toMatchObject({
        id: 'di-id',
        role: 'dietitian',
      });
    });

    it('When addAnotherProfessional with nutritionist role, should return failure', () => {
      expect(() =>
        runner.run({
          data: {
            pathType: 'wlm',
            professionalId: 'nt-id',
            professionalRole: 'nutritionist',
          },
          type: 'ADD_ANOTHER_PROFESSIONAL',
        }),
      ).toThrowError('PROFESSIONAL_ROLE_ALREADY_EXISTS');
    });

    describe('Given two professionals', () => {
      beforeEach(() => {
        runner.run({
          data: {
            pathType: 'wlm',
            professionalId: 'di-id',
            professionalRole: 'dietitian',
          },
          type: 'ADD_ANOTHER_PROFESSIONAL',
        });
      });

      it('When addAnotherProfessional, should return failure', () => {
        expect(() =>
          runner.run({
            data: {
              pathType: 'wlm',
              professionalId: 'nt-id',
              professionalRole: 'nutritionist',
            },
            type: 'ADD_ANOTHER_PROFESSIONAL',
          }),
        ).toThrowError('MAX_PROFESSIONALS_REACHED');
      });
    });

    describe('Given a scheduled session', () => {
      beforeEach(() => {
        runner.run({
          data: {
            pathType: 'wlm',
            starAt: new Date('2025-12-01'),
          },
          type: 'SCHEDULE_SESSION',
        });
      });

      it('When schedule another session after, sequence should be right', () => {
        runner.run({
          data: {
            pathType: 'wlm',
            starAt: new Date('2025-12-02'),
          },
          type: 'SCHEDULE_SESSION',
        });

        expect(runner.getState().paths[0].sessions).toHaveLength(2);
        expect(runner.getState().paths[0].sessions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              sequence: 1,
              startAt: new Date('2025-12-01'),
            }),
            expect.objectContaining({
              sequence: 2,
              startAt: new Date('2025-12-02'),
            }),
          ]),
        );
      });

      it('When schedule a session before existing session, should update sequences', () => {
        const events = runner.run({
          data: {
            pathType: 'wlm',
            starAt: new Date('2025-11-30'),
          },
          type: 'SCHEDULE_SESSION',
        });

        expect(events).toHaveLength(2);
        expect(events[0].type).toBe('SESSION_SCHEDULED');
        expect(events[1].type).toBe('SESSIONS_SEQUENCE_CHANGED');

        const sessions = runner.getState().paths[0].sessions;
        expect(sessions).toHaveLength(2);

        expect.arrayContaining([
          expect.objectContaining({
            sequence: 1,
            startAt: new Date('2025-11-30'),
          }),
          expect.objectContaining({
            sequence: 2,
            startAt: new Date('2025-12-01'),
          }),
          expect.objectContaining({
            sequence: 3,
            startAt: new Date('2025-12-02'),
          }),
        ]);
      });
    });
  });

  describe('Given a patient with an active psychotherapy path', () => {
    beforeEach(() => {
      runner.run({
        data: {
          professionalId: 'psy-id',
          professionalRole: 'psychologist',
          type: 'psychotherapy',
        },
        type: 'START_PATH',
      });
    });

    it('When scheduleSessions, should schedule a session of 45 mins', () => {
      runner.run({
        data: {
          pathType: 'psychotherapy',
          starAt: new Date('2025-12-01'),
        },
        type: 'SCHEDULE_SESSION',
      });

      expect(runner.getState()['paths'][0].sessions).toHaveLength(1);
      expect(runner.getState()['paths'][0].sessions[0]).toMatchObject({
        duration: 45,
        id: expect.any(String),
        startAt: new Date('2025-12-01'),
        sequence: 1,
      });
    });

    it('When addAnotherProfessional, should return failure', () => {
      expect(() =>
        runner.run({
          data: {
            pathType: 'psychotherapy',
            professionalId: 'psy-id',
            professionalRole: 'psychologist',
          },
          type: 'ADD_ANOTHER_PROFESSIONAL',
        }),
      ).toThrowError('PATH_DOES_NOT_SUPPORT_MULTIPLE_PROFESSIONALS');
    });
  });
});
