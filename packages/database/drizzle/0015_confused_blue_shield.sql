CREATE TABLE IF NOT EXISTS "google" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(500) NOT NULL,
	"tokens" json NOT NULL
);
