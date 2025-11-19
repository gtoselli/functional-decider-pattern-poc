import { randomUUID } from 'node:crypto';
import { err, ok, type Result } from 'neverthrow';
import type { Command, Event, State } from '../decider-approach/types';
import type { PathType, ProfessionalRole } from '../shared-types';

export function decide(cmd: Command, state: State): Result<Event[], PatientTherapiesResultError> {
  switch (cmd.type) {
    case 'START_PATH': {
      if (findPath(state, cmd.data.type)) return err('PATH_ALREADY_EXISTS');

      return ok([
        {
          data: {
            pathId: randomUUID(),
            professionalId: cmd.data.professionalId,
            professionalRole: cmd.data.professionalRole,
            type: cmd.data.type,
          },
          type: 'PATH_STARTED',
        },
      ]);
    }
    case 'ADD_ANOTHER_PROFESSIONAL': {
      const pathState = findPath(state, cmd.data.pathType);
      if (!pathState) return err('MISSING_PATH');

      return PATH_RULES[pathState.type].canHaveAnotherProfessional(pathState, cmd.data.professionalRole).map(() => [
        {
          data: {
            pathType: cmd.data.pathType,
            professionalId: cmd.data.professionalId,
            professionalRole: cmd.data.professionalRole,
          },
          type: 'PROFESSIONAL_ADDED',
        },
      ]);
    }
    case 'SCHEDULE_SESSION': {
      const pathState = findPath(state, cmd.data.pathType);
      if (!pathState) return err('MISSING_PATH');
      const duration = PATH_RULES[pathState.type].getSessionDuration();

      const sequence = pathState.sessions.filter((s) => s.startAt < cmd.data.starAt).length + 1;
      const sessionsWithChangedSequence = getSessionsWithChangedSequence(pathState, cmd.data.starAt);

      return ok([
        {
          data: {
            duration,
            pathType: cmd.data.pathType,
            sessionId: randomUUID(),
            startAt: cmd.data.starAt,
            state: 'scheduled',
            sequence,
          },
          type: 'SESSION_SCHEDULED',
        },
        ...(sessionsWithChangedSequence.length
          ? [
              {
                data: {
                  pathType: cmd.data.pathType,
                  sessions: sessionsWithChangedSequence,
                },
                type: 'SESSIONS_SEQUENCE_CHANGED' as const,
              },
            ]
          : []),
      ]);
    }
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function findPath(state: State, type: PathType) {
  return state.paths.find((p) => p.type === type);
}

function getSessionsWithChangedSequence(pathState: State['paths'][number], newStartAt: Date) {
  return pathState.sessions
    .filter((s) => s.startAt >= newStartAt)
    .map((s) => ({
      sessionId: s.id,
      sequence: s.sequence + 1,
    }));
}

interface PathRulesStrategy {
  getSessionDuration: () => number;
  canHaveAnotherProfessional: (
    pathState: State['paths'][number],
    role: ProfessionalRole,
  ) => Result<void, PatientTherapiesResultError>;
}

function createWlmPathRules(): PathRulesStrategy {
  return {
    canHaveAnotherProfessional: (pathState, role) => {
      if (pathState.professionals.length === 2) return err('MAX_PROFESSIONALS_REACHED');
      if (role !== 'dietitian') return err('PROFESSIONAL_ROLE_ALREADY_EXISTS');
      return ok();
    },
    getSessionDuration: () => 60,
  };
}

function createPsychotherapyPathRules(): PathRulesStrategy {
  return {
    canHaveAnotherProfessional: () => {
      return err('PATH_DOES_NOT_SUPPORT_MULTIPLE_PROFESSIONALS');
    },
    getSessionDuration: () => 45,
  };
}

const PATH_RULES: Record<PathType, PathRulesStrategy> = {
  psychotherapy: createPsychotherapyPathRules(),
  wlm: createWlmPathRules(),
};

export type PatientTherapiesResultError =
  | 'PATH_ALREADY_EXISTS'
  | 'MISSING_PATH'
  | 'MAX_PROFESSIONALS_REACHED'
  | 'PROFESSIONAL_ROLE_ALREADY_EXISTS'
  | 'PATH_DOES_NOT_SUPPORT_MULTIPLE_PROFESSIONALS';
