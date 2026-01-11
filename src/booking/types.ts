export type State = { id: string } & (
  | {
      status: 'scheduled';
      patientId: string;
      startAt: Date;
      scheduledAt: Date;
      outcome: EventOutcome;
    }
  | {
      status: 'initial';
    }
);

export type EventOutcome =
  | null // Not yet resolved
  | {
      type: 'cancelled';
      cancelledAt: Date;
      cancellationType: CancellationType;
    }
  | {
      type: 'no_show';
      markedAt: Date;
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
interface MarkEventAsNoShow {
  type: 'MARK_AS_NO_SHOW';
  data: {};
}
export type Command = ScheduleEventCmd | RescheduleEventCmd | CancelEventCmd | MarkEventAsNoShow;

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
  data: { cancelledAt: Date; cancellationType: CancellationType };
}
interface EventMarkedAsNoShowEvent {
  type: 'EVENT_MARKED_AS_NO_SHOW';
  data: { markedAsNoShowAt: Date };
}
export type Event = EventScheduledEvent | EventRescheduledEvent | EventCancelledEvent | EventMarkedAsNoShowEvent;

type CancellationType = 'late' | 'normal';
