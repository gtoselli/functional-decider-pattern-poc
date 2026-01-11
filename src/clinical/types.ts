import type { Decider } from '../@utils/decider';
import type { PathType } from '../shared-types';

export interface State {
  id: string;
  paths: {
    id: string;
    type: PathType;
    startedAt: Date;
    professionals: { id: string; addedAt: Date; role: ProfessionalRole }[];
    sessions: {
      id: string;
      number: number;
      startAt: Date;
      removedAt: Date | null;
      removalReason: RemovalReason | null;
    }[];
    cycle?: { startedAt: Date; endedAt?: Date };
  }[];
}

interface AddSessionCmd {
  type: 'ADD_SESSION';
  data: { id: string; startAt: Date; pathId: string };
}

interface ReassessSessionCmd {
  type: 'REASSESS_SESSION';
  data: { id: string; startAt: Date };
}

interface RemoveSessionCmd {
  type: 'REMOVE_SESSION';
  data: { id: string; reason: RemovalReason };
}

interface AddProfessionalCmd {
  type: 'ADD_PROFESSIONAL';
  data: { pathId: string; professionalId: string; role: ProfessionalRole };
}

interface StartPathCmd {
  type: 'START_PATH';
  data: { pathType: PathType };
}

export type Command = AddSessionCmd | ReassessSessionCmd | RemoveSessionCmd | AddProfessionalCmd | StartPathCmd;

interface SessionAddedEvent {
  type: 'SESSION_ADDED';
  data: { id: string; startAt: Date; pathId: string };
}

interface PathSequenceChanged {
  type: 'PATH_SEQUENCE_CHANGED';
  data: { id: string; sessions: { number: number; id: string }[] };
}

interface SessionMovedEvent {
  type: 'SESSION_MOVED';
  data: { id: string; startAt: Date; pathId: string };
}

interface SessionRemovedEvent {
  type: 'SESSION_REMOVED';
  data: { id: string; removedAt: Date; pathId: string; reason: RemovalReason };
}

interface ProfessionalAddedEvent {
  type: 'PROFESSIONAL_ADDED';
  data: { pathId: string; professionalId: string; addedAt: Date; role: ProfessionalRole };
}

interface PathStartedEvent {
  type: 'PATH_STARTED';
  data: { id: string; pathType: PathType; startedAt: Date };
}

export type Event =
  | SessionAddedEvent
  | PathSequenceChanged
  | SessionMovedEvent
  | SessionRemovedEvent
  | ProfessionalAddedEvent
  | PathStartedEvent;

export type ClinicalDecider = Decider<State, Command, Event>;

export type ProfessionalRole = 'professional' | 'dietitian' | 'nutritionist';

export type RemovalReason = 'cancelled' | 'late_cancelled' | 'no_show';
