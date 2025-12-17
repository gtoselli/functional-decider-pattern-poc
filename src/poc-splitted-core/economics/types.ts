export interface State {
  id: string;
  prices: {
    id: string;
    cost: number;
    reason: 'first_session' | 'standard';
  }[];
}

interface EvaluatePriceCmd {
  type: 'EVALUATE_PRICE';
  data: { sessionId: string; number: number };
}

export type Command = EvaluatePriceCmd;

interface PriceEvaluatedEvent {
  type: 'PRICE_EVALUATED';
  data: { id: string; cost: number; reason: State['prices'][0]['reason'] };
}

export type Event = PriceEvaluatedEvent;
