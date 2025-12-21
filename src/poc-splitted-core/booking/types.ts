import type { Decider } from '../../@utils/decider';

export interface State {
  id: string;
  events: {
    id: string;
    startAt: Date;
    cancelledAt: Date | null;
  }[];
}

interface ScheduleEventCmd {
  type: 'SCHEDULE_EVENT';
  data: { startAt: Date };
}
interface RescheduleEventCmd {
  type: 'RESCHEDULE_EVENT';
  data: { id: string; startAt: Date };
}
interface CancelEventCmd {
  type: 'CANCEL_EVENT';
  data: { id: string };
}
export type Command = ScheduleEventCmd | RescheduleEventCmd | CancelEventCmd;

interface EventScheduledEvent {
  type: 'EVENT_SCHEDULED';
  data: { id: string; startAt: Date };
}
interface EventRescheduledEvent {
  type: 'EVENT_RESCHEDULED';
  data: { id: string; startAt: Date };
}
interface EventCancelledEvent {
  type: 'EVENT_CANCELLED';
  data: { id: string; cancelledAt: Date; startAt: Date };
}
export type Event = EventScheduledEvent | EventRescheduledEvent | EventCancelledEvent;

export type BookingDecider = Decider<State, Command, Event>;
