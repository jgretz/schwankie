DROP INDEX IF EXISTS "idx_tag_alias_source";
DROP INDEX IF EXISTS "idx_tag_alias_canonical";
ALTER TABLE "tag_alias" DROP CONSTRAINT IF EXISTS "tag_alias_canonical_tag_id_tag_id_fk";
ALTER TABLE "tag" DROP COLUMN IF EXISTS "normalized_at";
DROP TABLE IF EXISTS "tag_alias";
