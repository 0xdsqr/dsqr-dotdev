CREATE TABLE "email_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"source" varchar(100),
	"tags" jsonb DEFAULT '{}',
	CONSTRAINT "email_subscribers_email_unique" UNIQUE("email")
);
