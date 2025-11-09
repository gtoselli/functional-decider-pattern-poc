import type { PathType, ProfessionalRole, SessionState } from '../shared-types';

export interface State {
  id: string;
  paths: {
    id: string;
    type: PathType;
    sessions: {
      id: string;
      startAt: Date;
      state: 'scheduled' | 'cancelled';
      duration: number;
      sequence: number;
    }[];
    professionals: {
      id: string;
      role: ProfessionalRole;
    }[];
  }[];
}

interface StartPathCmd {
  type: 'START_PATH';
  data: {
    type: PathType;
    professionalId: string;
    professionalRole: ProfessionalRole;
  };
}
interface ScheduleSessionCmd {
  type: 'SCHEDULE_SESSION';
  data: {
    pathType: PathType;
    starAt: Date;
  };
}
interface AddAnotherProfessionalCmd {
  type: 'ADD_ANOTHER_PROFESSIONAL';
  data: {
    pathType: PathType;
    professionalId: string;
    professionalRole: ProfessionalRole;
  };
}

export type Command = StartPathCmd | ScheduleSessionCmd | AddAnotherProfessionalCmd;

interface PathStartedEvent {
  type: 'PATH_STARTED';
  data: {
    pathId: string;
    type: PathType;
    professionalId: string;
    professionalRole: ProfessionalRole;
  };
}

interface SessionScheduledEvent {
  type: 'SESSION_SCHEDULED';
  data: {
    sessionId: string;
    pathType: PathType;
    startAt: Date;
    duration: number;
    state: SessionState;
    sequence: number;
  };
}

interface ProfessionalAddedEvent {
  type: 'PROFESSIONAL_ADDED';
  data: {
    pathType: PathType;
    professionalId: string;
    professionalRole: ProfessionalRole;
  };
}

interface SessionsSequenceChangedEvent {
  type: 'SESSIONS_SEQUENCE_CHANGED';
  data: {
    pathType: PathType;
    sessions: {
      sessionId: string;
      sequence: number;
    }[];
  };
}

export type Event = PathStartedEvent | SessionScheduledEvent | ProfessionalAddedEvent | SessionsSequenceChangedEvent;
