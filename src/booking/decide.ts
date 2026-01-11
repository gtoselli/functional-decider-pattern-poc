import { differenceInHours } from 'date-fns';
import type { Command, Event, State } from './types';

export function decide(cmd: Command, state: State): Event[] {
  switch (cmd.type) {
    case 'SCHEDULE_EVENT':
      return scheduleEvent(state, cmd.data.startAt, cmd.data.patientId);
    case 'CANCEL_EVENT':
      return cancelEvent(state);
    case 'RESCHEDULE_EVENT':
      return rescheduleEvent(state, cmd.data.startAt);
    case 'MARK_AS_NO_SHOW':
      return markAsNoShow(state);
    default: {
      const _exhaustive: never = cmd;
      return _exhaustive;
    }
  }
}

function scheduleEvent(state: State, startAt: Date, patientId: string): Event[] {
  if (state.status === 'scheduled') throw new Error('Event already scheduled');
  return [
    {
      data: { id: state.id, startAt, patientId, scheduledAt: new Date() },
      type: 'EVENT_SCHEDULED',
    },
  ];
}

function cancelEvent(state: State): Event[] {
  if (state.status === 'initial') throw new Error('Event not scheduled');
  if (state.outcome !== null) throw new Error('Event already has an outcome');

  const cancelledAt = new Date();

  // Cannot cancel a session that already passed
  if (cancelledAt > state.startAt) {
    throw new Error('Cannot cancel a session that already passed. Use mark as no-show instead.');
  }

  const hoursUntilSession = differenceInHours(state.startAt, cancelledAt);
  const cancellationType = hoursUntilSession < 24 ? ('late' as const) : ('normal' as const);

  return [
    {
      data: { cancelledAt, cancellationType },
      type: 'EVENT_CANCELLED',
    },
  ];
}

function markAsNoShow(state: State): Event[] {
  if (state.status === 'initial') throw new Error('Event not scheduled');
  if (state.outcome !== null) throw new Error('Event already has an outcome');

  const markedAsNoShowAt = new Date();

  // Cannot mark no-show before session time
  if (markedAsNoShowAt < state.startAt) {
    throw new Error('Cannot mark no-show before session time');
  }

  return [
    {
      data: { markedAsNoShowAt },
      type: 'EVENT_MARKED_AS_NO_SHOW',
    },
  ];
}

function rescheduleEvent(state: State, startAt: Date): Event[] {
  if (state.status === 'initial') throw new Error('Event not scheduled');
  if (state.outcome !== null) throw new Error('Cannot reschedule event with outcome');

  return [{ data: { startAt }, type: 'EVENT_RESCHEDULED' }];
}
