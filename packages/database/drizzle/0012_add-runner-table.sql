CREATE TABLE IF NOT EXISTS "runner" (
	"worker_id" text PRIMARY KEY NOT NULL,
	"hostname" text NOT NULL,
	"pid" integer NOT NULL,
	"version" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_runner_last_heartbeat_at" ON "runner" ("last_heartbeat_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_runner_host_pid" ON "runner" ("hostname","pid");--> statement-breakpoint
DELETE FROM "setting" WHERE "key" = 'tasks_heartbeat_at';