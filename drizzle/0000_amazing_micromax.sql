CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`entity_name` text NOT NULL,
	`message` text NOT NULL,
	`before_data` text,
	`after_data` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `containers` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`icon` text DEFAULT 'Archive' NOT NULL,
	`color` text DEFAULT '#64748b' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`container_id` text,
	`name` text NOT NULL,
	`icon` text DEFAULT 'FlaskConical' NOT NULL,
	`icon_color` text DEFAULT '#2563eb' NOT NULL,
	`category` text DEFAULT '其他' NOT NULL,
	`stock_enabled` integer DEFAULT true NOT NULL,
	`stock_mode` text DEFAULT 'percentage' NOT NULL,
	`stock_percent` integer DEFAULT 100 NOT NULL,
	`initial_quantity` real,
	`current_quantity` real,
	`unit` text DEFAULT '个' NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`specification` text DEFAULT '' NOT NULL,
	`cas_number` text DEFAULT '' NOT NULL,
	`expiry_date` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text DEFAULT 'FlaskConical' NOT NULL,
	`color` text DEFAULT '#2563eb' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'LabSpace 实验室' NOT NULL,
	`low_stock_threshold` integer DEFAULT 20 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
