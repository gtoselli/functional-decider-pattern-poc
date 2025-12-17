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

interface AppointmentScheduledCmd {
  type: 'APPOINTMENT_SCHEDULED';
  data: { id: string; startAt: Date };
}
interface AppointmentRescheduledCmd {
  type: 'APPOINTMENT_RESCHEDULED';
  data: { id: string; startAt: Date };
}
interface AppointmentCancelledCmd {
  type: 'APPOINTMENT_CANCELLED';
  data: { id: string; cancelledAt: Date };
}
export type Event = AppointmentScheduledCmd | AppointmentRescheduledCmd | AppointmentCancelledCmd;
