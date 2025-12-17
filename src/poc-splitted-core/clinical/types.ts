export interface State {
  id: string;
  paths: {
    id: string;
    sessions: { id: string; number: number };
  }[];
}

interface ClassifySessionCmd {
  type: 'CLASSIFY_SESSION';
  data: { appointmentId: string; startAt: Date };
}

export type Command = ClassifySessionCmd;

interface SessionClassifiedEvent {
  type: 'SESSION_CLASSIFIED';
  data: { id: string; appointmentId: string; number: number };
}

export type Event = SessionClassifiedEvent;
