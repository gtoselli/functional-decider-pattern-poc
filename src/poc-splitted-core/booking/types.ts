import type { Decider } from '../../@utils/decider';

export interface State {
  id: string;
  appointments: {
    id: string;
    startAt: Date;
    cancelledAt: Date | null;
  }[];
}

interface ScheduleAppointmentCmd {
  type: 'SCHEDULE_APPOINTMENT';
  data: { startAt: Date };
}
interface RescheduleAppointmentCmd {
  type: 'RESCHEDULE_APPOINTMENT';
  data: { id: string; startAt: Date };
}
interface CancelAppointmentCmd {
  type: 'CANCEL_APPOINTMENT';
  data: { id: string };
}
export type Command = ScheduleAppointmentCmd | RescheduleAppointmentCmd | CancelAppointmentCmd;

interface AppointmentScheduledEvent {
  type: 'APPOINTMENT_SCHEDULED';
  data: { id: string; startAt: Date };
}
interface AppointmentRescheduledEvent {
  type: 'APPOINTMENT_RESCHEDULED';
  data: { id: string; startAt: Date };
}
interface AppointmentCancelledEvent {
  type: 'APPOINTMENT_CANCELLED';
  data: { id: string; cancelledAt: Date; startAt: Date };
}
export type Event = AppointmentScheduledEvent | AppointmentRescheduledEvent | AppointmentCancelledEvent;

export type BookingDecider = Decider<State, Command, Event>;
