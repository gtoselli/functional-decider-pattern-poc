import type { Decider } from '../../@utils/decider';

export type State =
  | {
      status: 'scheduled';
      id: string;
      patientId: string;
      startAt: Date;
      cancelledAt: Date | null;
      scheduledAt: Date;
    }
  | {
      status: 'initial';
      id: string;
    };

interface ScheduleEventCmd {
  type: 'SCHEDULE_EVENT';
  data: { startAt: Date; patientId: string };
}
interface RescheduleEventCmd {
  type: 'RESCHEDULE_EVENT';
  data: { startAt: Date };
}
interface CancelEventCmd {
  type: 'CANCEL_EVENT';
  data: {};
}
export type Command = ScheduleEventCmd | RescheduleEventCmd | CancelEventCmd;

interface EventScheduledEvent {
  type: 'EVENT_SCHEDULED';
  data: { id: string; patientId: string; startAt: Date; scheduledAt: Date };
}
interface EventRescheduledEvent {
  type: 'EVENT_RESCHEDULED';
  data: { startAt: Date };
}
interface EventCancelledEvent {
  type: 'EVENT_CANCELLED';
  data: { cancelledAt: Date };
}
export type Event = EventScheduledEvent | EventRescheduledEvent | EventCancelledEvent;

export type BookingDecider = Decider<State, Command, Event>;
