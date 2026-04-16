ALTER TABLE "posts" ALTER COLUMN "file_path" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "published" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "content" text;