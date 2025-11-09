import { randomUUID } from 'node:crypto';
import type { PathType, ProfessionalRole } from '../shared-types';
import type { Command, Event, State } from './types';

export function decide(cmd: Command, currentState: State): Event[] {
  switch (cmd.type) {
    case 'START_PATH': {
      if (findPath(currentState, cmd.data.type)) throw new Error('Path already exists');

      return [
        {
          data: {
            pathId: randomUUID(),
            professionalId: cmd.data.professionalId,
            professionalRole: cmd.data.professionalRole,
            type: cmd.data.type,
          },
          type: 'PATH_STARTED',
        },
      ];
    }
    case 'ADD_ANOTHER_PROFESSIONAL': {
      const pathState = findPath(currentState, cmd.data.pathType);
      if (!pathState) throw new Error('PATH_NOT_FOUND');
      PATH_RULES[pathState.type].canHaveAnotherProfessional(pathState, cmd.data.professionalRole);

      return [
        {
          data: {
            pathType: cmd.data.pathType,
            professionalId: cmd.data.professionalId,
            professionalRole: cmd.data.professionalRole,
          },
          type: 'PROFESSIONAL_ADDED',
        },
      ];
    }
    case 'SCHEDULE_SESSION': {
      const pathState = findPath(currentState, cmd.data.pathType);
      if (!pathState) throw new Error('PATH_NOT_FOUND');
      const duration = PATH_RULES[pathState.type].getSessionDuration();

      const sequence = pathState.sessions.filter((s) => s.startAt < cmd.data.starAt).length + 1;
      const sessionsWithChangedSequence = getSessionsWithChangedSequence(pathState, cmd.data.starAt);

      return [
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
      ];
    }
  }
  throw new Error('Unknown command');
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
  canHaveAnotherProfessional: (pathState: State['paths'][number], role: ProfessionalRole) => void;
}

function createWlmPathRules(): PathRulesStrategy {
  return {
    canHaveAnotherProfessional: (pathState, role) => {
      if (pathState.professionals.length === 2) throw new Error('MAX_PROFESSIONALS_REACHED');
      if (role !== 'dietitian') throw new Error('PROFESSIONAL_ROLE_ALREADY_EXISTS');
    },
    getSessionDuration: () => 60,
  };
}

function createPsychotherapyPathRules(): PathRulesStrategy {
  return {
    canHaveAnotherProfessional: () => {
      throw new Error('PATH_DOES_NOT_SUPPORT_MULTIPLE_PROFESSIONALS');
    },
    getSessionDuration: () => 45,
  };
}

const PATH_RULES: Record<PathType, PathRulesStrategy> = {
  psychotherapy: createPsychotherapyPathRules(),
  wlm: createWlmPathRules(),
};
