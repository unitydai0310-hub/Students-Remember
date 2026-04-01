CREATE TABLE `groupingSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`createdById` int NOT NULL,
	`groupSize` int NOT NULL,
	`suggestions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupingSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdById` int NOT NULL,
	`studentIds` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`photoUrl` text,
	`photoKey` varchar(512),
	`personalityData` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
