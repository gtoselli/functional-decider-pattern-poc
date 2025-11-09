import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PatientPaths } from './oop-approach/aggregate';

describe('oop approach', () => {
  let aggregate: PatientPaths;
  beforeEach(() => {
    aggregate = PatientPaths.factory('foo-id');
  });

  describe('Given a patient with no paths', () => {
    it('When start, should add a new path', () => {
      aggregate.start('wlm', 'nt-id', 'nutritionist');

      expect(aggregate['paths']).toHaveLength(1);
      expect(aggregate['paths'][0]).toMatchObject({
        id: expect.any(String),
        professionals: [{ id: 'nt-id', role: 'nutritionist' }],
        type: 'wlm',
      });
    });
  });

  describe('Given a patient with an active wlm path', () => {
    let aggregate: PatientPaths;
    beforeEach(() => {
      aggregate = PatientPaths.factory('foo-id');
      aggregate.start('wlm', 'nt-id', 'nutritionist');
    });

    it('When scheduleSessions, should schedule a session of 60 mins', () => {
      aggregate.scheduleSession('wlm', new Date('2025-12-01'));

      expect(aggregate['paths'][0].sessions).toHaveLength(1);
      expect(aggregate['paths'][0].sessions[0]).toMatchObject({
        duration: 60,
        id: expect.any(String),
        startAt: new Date('2025-12-01'),
      });
    });

    it('When addAnotherProfessional with dietitian role, should add the professional', () => {
      aggregate.addAnotherProfessional('wlm', 'di-id', 'dietitian');

      expect(aggregate['paths'][0].professionals).toHaveLength(2);
      expect(aggregate['paths'][0].professionals[1]).toMatchObject({
        id: 'di-id',
        role: 'dietitian',
      });
    });

    it('When addAnotherProfessional with nutritionist role, should throw', () => {
      expect(() => aggregate.addAnotherProfessional('wlm', 'di-id', 'nutritionist')).toThrowError();
    });

    describe('Given two professionals', () => {
      beforeAll(() => {
        aggregate.addAnotherProfessional('wlm', 'di-id', 'dietitian');
      });

      it('When addAnotherProfessional, should throw', () => {
        expect(() => aggregate.addAnotherProfessional('wlm', 'di-id', 'nutritionist')).toThrowError();
      });
    });
  });

  describe('Given a patient with an active psychotherapy path', () => {
    let aggregate: PatientPaths;
    beforeAll(() => {
      aggregate = PatientPaths.factory('foo-id');
      aggregate.start('psychotherapy', 'psy-id', 'psychologist');
    });

    it('When scheduleSessions, should schedule a session of 45 mins', () => {
      aggregate.scheduleSession('psychotherapy', new Date('2025-12-01'));

      expect(aggregate['paths'][0].sessions).toHaveLength(1);
      expect(aggregate['paths'][0].sessions[0]).toMatchObject({
        duration: 45,
        id: expect.any(String),
        startAt: new Date('2025-12-01'),
      });
    });

    it('When addAnotherProfessional, should throw', () => {
      expect(() => aggregate.addAnotherProfessional('psychotherapy', 'foo-an-id', 'psychologist')).toThrowError(
        'This path can not have another professional',
      );
    });
  });
});
