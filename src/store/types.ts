export interface Store<State> {
  getById(id: string): Promise<State | null>;
  save(state: State): Promise<void>;
  purge(id: string): Promise<void>;
}

export interface ESStore<Event> {
  load(key: string): Promise<Event[]>;
  append(key: string, events: Event[]): Promise<void>;
  purge(key: string): Promise<void>;
}
