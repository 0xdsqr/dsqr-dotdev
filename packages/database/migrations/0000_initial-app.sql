CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TABLE "app"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"email" varchar(254) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"subscribed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	CONSTRAINT "subscriptions_email_unique" UNIQUE("email"),
	CONSTRAINT "subscriptions_email_normalized" CHECK ("app"."subscriptions"."email" = lower(btrim("app"."subscriptions"."email")) and length("app"."subscriptions"."email") > 0),
	CONSTRAINT "subscriptions_status_valid" CHECK ("app"."subscriptions"."status" in ('pending', 'subscribed', 'unsubscribed')),
	CONSTRAINT "subscriptions_unsubscribe_consistent" CHECK (("app"."subscriptions"."status" = 'unsubscribed') = ("app"."subscriptions"."unsubscribed_at" is not null))
);
