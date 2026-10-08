export type CurrentSection =
  | 'queue'
  | 'feeds'
  | 'emails'
  | 'daily-summary'
  | 'history'
  | 'admin'
  | 'public'
  | 'about';

export type Tag = {
  id: number;
  text: string;
  count: number;
};
