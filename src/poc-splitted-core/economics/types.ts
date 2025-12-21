import type { Decider } from '../../@utils/decider';

export interface State {
  id: string;
  prices: {
    id: string;
    cost: number;
    reason: 'first_session' | 'standard';
    status: 'quoted' | 'released';
  }[];
}

interface QuoteServiceCmd {
  type: 'QUOTE_SERVICE';
  data: { sessionId: string; number: number };
}

interface ReleaseQuoteCmd {
  type: 'RELEASE_QUOTE';
  data: { sessionId: string };
}

export type Command = QuoteServiceCmd | ReleaseQuoteCmd;

interface ServiceQuotedEvent {
  type: 'SERVICE_QUOTED';
  data: { id: string; cost: number; reason: State['prices'][0]['reason'] };
}

interface QuoteReleasedEvent {
  type: 'QUOTE_RELEASED';
  data: { id: string };
}

export type Event = ServiceQuotedEvent | QuoteReleasedEvent;

export type EconomicsDecider = Decider<State, Command, Event>;
