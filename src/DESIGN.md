
Three different contexts:
- booking. Talks about "event"
- clinical. Talks about "session"
- economics. Talks about "service"


Booking
- Schedule Event -> Event Scheduled
- Reschedule Event -> Event Rescheduled
- Cancel Event -> Event Cancelled

Clinical
- Add Session -> Session Added / Session Classified
- Reassess Session -> Session Classified
- Revoke Session -> Session Revoked

Economics
- Quote Service -> Service Quoted


---
Use cases
- cancel session
- mark session as no show
- reschedule session
- schedule session
  - get path
  - check if before first session
  - assert can schedule session (by path)
  - get duration (by path and professional number)
  - 
- start therapy
- on payment scheduled (confirm session)
- on subscription created (start path cycle & activate subscription)
    - get path by type
    - check cycle must be not started
- on subscription deleted (end path cycle & remove subscription)
  - get path by type
  - check cycle must be started
  - check cycle must be not ended
  - cancel future sessions with PATH_CYCLE_ENDED reason
  - 
- 