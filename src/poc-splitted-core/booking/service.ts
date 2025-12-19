import { createBookingRepo } from '../infra';

export function createBookingService() {
  const bookingRepo = createBookingRepo();

  return {
    scheduleAppointment(params: { patientId: string; startAt: Date }) {
      const booking = bookingRepo.getById(params.patientId);
      booking.run({ data: { startAt: params.startAt }, type: 'SCHEDULE_APPOINTMENT' });
      bookingRepo.save(booking);
    },
    rescheduleAppointment(params: { patientId: string; appointmentId: string; startAt: Date }) {
      const booking = bookingRepo.getById(params.patientId);
      booking.run({ data: { id: params.appointmentId, startAt: params.startAt }, type: 'RESCHEDULE_APPOINTMENT' });
      bookingRepo.save(booking);
    },
    cancelAppointment(params: { patientId: string; appointmentId: string }) {
      const booking = bookingRepo.getById(params.patientId);
      booking.run({ data: { id: params.appointmentId }, type: 'CANCEL_APPOINTMENT' });
      bookingRepo.save(booking);
    },
  };
}
