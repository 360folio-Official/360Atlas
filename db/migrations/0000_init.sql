CREATE TABLE `account` (
	`id` varchar(36) NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` varchar(36) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` timestamp(3),
	`refreshTokenExpiresAt` timestamp(3),
	`scope` text,
	`password` text,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`slug` varchar(40) NOT NULL,
	`icon` varchar(16) NOT NULL DEFAULT '',
	`hue` smallint NOT NULL DEFAULT 200,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `categories_slug` PRIMARY KEY(`slug`)
);
--> statement-breakpoint
CREATE TABLE `click_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`listingId` bigint unsigned NOT NULL,
	`kind` enum('view','tour_open','website','booking') NOT NULL,
	`locale` varchar(8),
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `click_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`listingId` bigint unsigned,
	`name` varchar(160) NOT NULL,
	`email` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`readAt` datetime,
	CONSTRAINT `enquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`memberId` int,
	`creditedProviderId` int,
	`title` varchar(200) NOT NULL,
	`categorySlug` varchar(40) NOT NULL,
	`tourUrl` varchar(700) NOT NULL,
	`platform` varchar(60) NOT NULL,
	`thumbnailPath` varchar(300),
	`lat` decimal(9,6),
	`lng` decimal(9,6),
	`address` varchar(300),
	`city` varchar(120),
	`country` varchar(120),
	`websiteUrl` varchar(500),
	`bookingUrl` varchar(500),
	`status` enum('pending','live','broken_link','hidden') NOT NULL DEFAULT 'pending',
	`featured` boolean NOT NULL DEFAULT false,
	`seeded` boolean NOT NULL DEFAULT false,
	`lastCheckedAt` datetime,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `listings_id` PRIMARY KEY(`id`),
	CONSTRAINT `listings_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `listings_tour_url_idx` UNIQUE(`tourUrl`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(36),
	`slug` varchar(120) NOT NULL,
	`type` enum('provider','owner') NOT NULL DEFAULT 'provider',
	`businessName` varchar(160) NOT NULL,
	`contactName` varchar(160),
	`bio` text,
	`websiteUrl` varchar(500),
	`logoPath` varchar(300),
	`platforms` text NOT NULL,
	`languages` text NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`featured` boolean NOT NULL DEFAULT false,
	`plan` enum('free','pro','business') NOT NULL DEFAULT 'free',
	`claimedAt` datetime,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `members_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `service_areas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`city` varchar(120),
	`country` varchar(120),
	`lat` decimal(9,6) NOT NULL,
	`lng` decimal(9,6) NOT NULL,
	`radiusKm` int NOT NULL DEFAULT 50,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `service_areas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) NOT NULL,
	`expiresAt` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`ipAddress` text,
	`userAgent` text,
	`userId` varchar(36) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`memberId` int NOT NULL,
	`customerId` varchar(120) NOT NULL,
	`subscriptionId` varchar(120),
	`plan` enum('free','pro','business') NOT NULL DEFAULT 'free',
	`status` varchar(40) NOT NULL,
	`currentPeriodEnd` datetime,
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `subscriptions_memberId_pk` PRIMARY KEY(`memberId`),
	CONSTRAINT `subscriptions_customerId_unique` UNIQUE(`customerId`),
	CONSTRAINT `subscriptions_subscriptionId_unique` UNIQUE(`subscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`image` text,
	`role` enum('member','admin') NOT NULL DEFAULT 'member',
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expiresAt` timestamp(3) NOT NULL,
	`createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `click_events` ADD CONSTRAINT `click_events_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enquiries` ADD CONSTRAINT `enquiries_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_creditedProviderId_members_id_fk` FOREIGN KEY (`creditedProviderId`) REFERENCES `members`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_categorySlug_categories_slug_fk` FOREIGN KEY (`categorySlug`) REFERENCES `categories`(`slug`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_areas` ADD CONSTRAINT `service_areas_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_memberId_members_id_fk` FOREIGN KEY (`memberId`) REFERENCES `members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`userId`);--> statement-breakpoint
CREATE INDEX `click_events_listing_idx` ON `click_events` (`listingId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `enquiries_member_idx` ON `enquiries` (`memberId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listings_lat_lng_idx` ON `listings` (`lat`,`lng`);--> statement-breakpoint
CREATE INDEX `listings_category_status_idx` ON `listings` (`categorySlug`,`status`);--> statement-breakpoint
CREATE INDEX `listings_member_idx` ON `listings` (`memberId`);--> statement-breakpoint
CREATE INDEX `listings_created_idx` ON `listings` (`createdAt`);--> statement-breakpoint
CREATE INDEX `members_type_idx` ON `members` (`type`);--> statement-breakpoint
CREATE INDEX `service_areas_member_idx` ON `service_areas` (`memberId`);--> statement-breakpoint
CREATE INDEX `service_areas_lat_lng_idx` ON `service_areas` (`lat`,`lng`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`userId`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);