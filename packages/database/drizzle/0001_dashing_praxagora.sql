DROP TABLE "tag";--> statement-breakpoint
DROP TABLE "link_tag";--> statement-breakpoint
ALTER TABLE "link" ADD COLUMN "tags" json DEFAULT '[]'::json;