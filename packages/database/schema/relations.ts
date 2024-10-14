import {relations} from 'drizzle-orm/relations';
import {link, linkTag, tag} from './links.schema';

export const linkTagRelations = relations(linkTag, ({one}) => ({
  link: one(link, {
    fields: [linkTag.linkId],
    references: [link.id],
  }),
  tag: one(tag, {
    fields: [linkTag.tagId],
    references: [tag.id],
  }),
}));

export const linkRelations = relations(link, ({many}) => ({
  linkTags: many(linkTag),
}));

export const tagRelations = relations(tag, ({many}) => ({
  linkTags: many(linkTag),
}));
