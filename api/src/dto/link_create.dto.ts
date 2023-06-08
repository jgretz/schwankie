export type LinkCreateDto = {
  url: string;
  title: string;
  description?: string;
  image_url?: string;

  tags: string;
};
