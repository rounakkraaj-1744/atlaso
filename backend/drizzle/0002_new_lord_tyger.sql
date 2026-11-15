CREATE TABLE "architecture_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"architecture_id" uuid NOT NULL,
	"document" jsonb DEFAULT '{"nodes":[],"connections":[],"viewport":{"x":0,"y":0,"zoom":1}}'::jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "architecture_documents_architecture_id_unique" UNIQUE("architecture_id")
);
--> statement-breakpoint
ALTER TABLE "architecture_documents" ADD CONSTRAINT "architecture_documents_architecture_id_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."architectures"("id") ON DELETE cascade ON UPDATE no action;
