export type CurrentSection = 'queue' | 'feeds' | 'emails' | 'admin' | 'public';

export type Tag = {
  id: number;
  text: string;
  count: number;
};
