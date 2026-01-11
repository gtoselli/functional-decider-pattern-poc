
Three different contexts:
- booking. Talks about "event"
- clinical. Talks about "session" (step in a path)
- economics. Talks about "service"


Booking guida, aggiunge/toglie.
Il tuo path quindi cambia, come conseguenza di booking
La parte di booking reagisce al cambio del path 


## Cancellation & No-Show

**Ownership:**
- **Booking**: Decides categorization (normal/late cancellation based on 24hr threshold, no-show)
- **Clinical**: Passes through removal reason, doesn't interpret (all are just "session didn't happen")
- **Economics**: Reacts to reason for pricing (normal → void, late/no-show → charge)

**Flow:**
1. Booking emits: EVENT_CANCELLED{cancellationType: 'late'|'normal'} or EVENT_MARKED_NO_SHOW
2. AppService maps to Clinical: removeSession({reason: 'cancelled'|'late_cancelled'|'no_show'})
3. Clinical stores and returns reason via getSessions()
4. Economics decides: 'cancelled' → VOIDED, 'late_cancelled'|'no_show' → ESTIMATED (charged)

**State design:**
- Booking uses discriminated union for outcome (prevents invalid states like both cancelled AND no-show)
- Validations: can't cancel after session passed, can't mark no-show before session time

---

Booking
- Schedule Event -> Event Scheduled
- Reschedule Event -> Event Rescheduled
- Cancel Event -> Event Cancelled (with cancellationType)
- Mark As No Show -> Event Marked As No Show

Clinical
- Add Session -> Session Added / Session Classified
- Reassess Session -> Session Classified
- Remove Session -> Session Removed (with reason)

Economics
- Revise Estimates -> Prices Revised


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