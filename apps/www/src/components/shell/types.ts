export type CurrentSection =
  | 'queue'
  | 'feeds'
  | 'emails'
  | 'daily-summary'
  | 'admin'
  | 'public'
  | 'about';

export type Tag = {
  id: number;
  text: string;
  count: number;
};
