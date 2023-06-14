// Response Types
export interface LinkSearchResponseItem {
  id: number;
  url: string;
  title: string;
  description?: string;
  image_url?: string;

  update_date: Date;

  link_tag: [
    {
      tag: {
        id: number;
        text: string;
      };
    },
  ];
}
