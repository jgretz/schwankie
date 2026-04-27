export type CurrentSection = 'queue' | 'feeds' | 'emails' | 'admin' | 'public' | 'about';

export type Tag = {
  id: number;
  text: string;
  count: number;
};
