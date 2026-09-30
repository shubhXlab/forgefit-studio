-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: forgefit
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `forgefit`
--

/*!40000 DROP DATABASE IF EXISTS `forgefit`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `forgefit` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `forgefit`;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `actor_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `detail` text DEFAULT NULL,
  `ip` varchar(100) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_audit_actor` (`actor_id`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,1,'login',NULL,'::1',1790780589342),(2,NULL,'register','member@forgefit.com','::1',1790780722702),(3,NULL,'login_failed','admin@forgefit.com','::1',1790780776617),(4,NULL,'login_failed','admin@forgefit.com','::1',1790780778767),(5,1,'login',NULL,'::1',1790780800536),(6,1,'logout',NULL,'::1',1790781064306),(7,3,'register','member@forgefit.com','::1',1790781110123),(8,3,'verify_email',NULL,'::1',1790781134222),(9,3,'login',NULL,'::1',1790781137349),(10,3,'book_class','Athletic Yoga & Deep Recovery','::1',1790781339789),(11,3,'logout',NULL,'::1',1790781821980),(12,3,'password_reset_requested',NULL,'::1',1790781843928),(13,3,'password_reset_done',NULL,'::1',1790781883507),(14,3,'login',NULL,'::1',1790781931106),(15,3,'logout',NULL,'::1',1790781970199),(16,1,'login',NULL,'::1',1790781994290),(17,1,'member_deleted','member@forgefit.com','::1',1790782007604),(18,1,'contact_message','member@forgefit.com','::1',1790782075547),(19,1,'message_delete','id 1','::1',1790782097415),(20,1,'login',NULL,'::1',1790782631906),(21,1,'login',NULL,'::1',1790782667399),(22,1,'login',NULL,'::1',1790782682213),(23,1,'login',NULL,'::1',1790782695148),(24,1,'login',NULL,'::1',1790787878301),(25,1,'login',NULL,'::1',1790788154555),(26,1,'login',NULL,'::1',1790788176397),(27,1,'login',NULL,'::1',1790788266844),(28,1,'login',NULL,'::1',1790788976992);
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_codes`
--

DROP TABLE IF EXISTS `backup_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `code_hash` varchar(191) NOT NULL,
  `used_at` bigint(20) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_hash` (`code_hash`),
  KEY `fk_backup_codes_user` (`user_id`),
  CONSTRAINT `fk_backup_codes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_codes`
--

LOCK TABLES `backup_codes` WRITE;
/*!40000 ALTER TABLE `backup_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'booked',
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_bookings_class` (`class_id`,`status`),
  KEY `ix_bookings_user_class` (`user_id`,`class_id`),
  CONSTRAINT `fk_bookings_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,3,3,'booked',1790781339788);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `trainer_name` varchar(255) NOT NULL DEFAULT '',
  `schedule` varchar(255) NOT NULL DEFAULT '',
  `capacity` int(11) NOT NULL DEFAULT 20,
  `duration_min` int(11) NOT NULL DEFAULT 60,
  `level` varchar(50) NOT NULL DEFAULT 'All levels',
  `price` double NOT NULL DEFAULT 0,
  `image` varchar(255) NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,'Forge Strength & Hypertrophy','forge-strength-hypertrophy','A focused barbell and kettlebell strength session targeting progressive overload on squat, hinge, push, and pull patterns. Perfect for building raw strength, lean muscle mass, and joint resilience under expert coaching.','Coach Vikram Sen','Mon / Wed / Fri · 06:30 AM & 06:00 PM',16,60,'Intermediate',500,'/img/class-strength.jpg',1,1790781277034,1790781725366),(2,'HIIT & Metabolic Conditioning','hiit-metabolic-conditioning','High-intensity interval training pairing assault bikes, ski ergs, kettlebell complexes, plyometrics, and functional turf drills. Engineered to elevate your lactate threshold and boost athletic stamina.','Coach Ananya Sharma','Tue / Thu / Sat · 07:00 AM & 07:00 PM',20,45,'All levels',450,'/img/class-hiit.jpg',1,1790781277034,1790781725366),(3,'Athletic Yoga & Deep Recovery','athletic-yoga-deep-recovery','Restorative dynamic flows, targeted hip and thoracic spine mobility, and guided downregulation breathwork. Specifically designed for active individuals to relieve tight muscles, prevent injury, and de-stress.','Coach Kabir Mehta','Wed / Sat / Sun · 08:30 AM & 05:30 PM',18,60,'All levels',400,'/img/class-yoga.jpg',1,1790781277034,1790781725366);
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `memberships`
--

DROP TABLE IF EXISTS `memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `starts_at` bigint(20) NOT NULL,
  `ends_at` bigint(20) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_memberships_user` (`user_id`),
  KEY `fk_memberships_plan` (`plan_id`),
  CONSTRAINT `fk_memberships_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`),
  CONSTRAINT `fk_memberships_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `memberships`
--

LOCK TABLES `memberships` WRITE;
/*!40000 ALTER TABLE `memberships` DISABLE KEYS */;
/*!40000 ALTER TABLE `memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) NOT NULL,
  `subject` varchar(255) NOT NULL DEFAULT '',
  `body` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `purpose` varchar(50) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `expires_at` bigint(20) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `consumed_at` bigint(20) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  `ip` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_otps_email_purpose` (`email`,`purpose`),
  KEY `fk_otps_user` (`user_id`),
  CONSTRAINT `fk_otps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` double NOT NULL DEFAULT 0,
  `duration_days` int(11) NOT NULL DEFAULT 30,
  `features` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
INSERT INTO `plans` VALUES (1,'Starter Pass',1999,30,'8 Studio classes per month\nFull gym floor & equipment access\nLocker room & private shower access\nFree initial body & fitness assessment\nOnline timetable & class booking',1,1,1790781277034),(2,'All-Access Pro',3499,30,'Unlimited studio classes (Strength, HIIT, Yoga)\nUnlimited gym floor access (6 AM - 10 PM)\nInfrared sauna & recovery zone access\n1 Complimentary 1-on-1 PT session per month\nPersonalized nutrition & macro guidance\n7-Day priority class booking window',1,2,1790781277034),(3,'Quarterly Athlete',8999,90,'Everything in All-Access Pro included\n3x 1-on-1 Personal coaching sessions\nBi-weekly InBody composition scans\n2 Complimentary guest passes per month\n15% Off all studio merchandise & supplements\nDedicated towel & premium locker service',1,3,1790781277034),(4,'Annual Elite',29999,365,'Full 365-day unlimited studio & class access\nMonthly 1-on-1 PT review & programming updates\nUnlimited sauna & contrast therapy lounge access\nExclusive ForgeFit athlete apparel & gym pack\nUnlimited weekend guest privileges\nUp to 60 days complimentary membership pause',1,4,1790781277034);
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `expires` bigint(20) DEFAULT NULL,
  `data` mediumtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('08ulnWxGpgW_LEbfXNDdqiQF2QpGWKXa',1791992833292,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:13.292Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"def7249c610eafa95a9d2e9568bdc1a3883522281b0d79d5\",\"flash\":[]}'),('0CVuJ9DxJNtJuHqngcX4G1LuTINT3ZvM',1791992834986,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:14.986Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"030172bec9e5502d1fd4585c08a6219967b8c7c35e0af565\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('0QZxoZHXWkoUqnsfO5M5ZfLAHUJQnxL7',1791998508379,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:21:48.379Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"2ff3a1e11c3ed25e1380d468471fc6b6b23944b4c7620baa\",\"flash\":[]}'),('10K5KhvoNYt_o2SZ4LLq3TYL6mHguJJG',1791994499222,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:14:59.222Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"42aa5c1643d6267527d83dbae771ec3184314e6ec90fb5e1\",\"flash\":[]}'),('1DN_2dM80tFSGHGPaj77Iqeq9t8GOPew',1791997875945,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:11:08.392Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"08921b9d5142a0f9f957ce72113f170bd2d1216259c149ce\",\"flash\":[]}'),('27IuVAy1QIFM94dqXhsrOFRznaYmF0f-',1791990168682,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:02:48.682Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"2ac0b7bf44fcd3861083cfffdaae56ccc13b55f1e7743c1a\",\"flash\":[]}'),('4Eb3J9O9p1pJ1TSYOfWS0HUL9_TLFipf',1791995927286,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:47.286Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"bce197aba9ca49b1a60fd5d33fe158b5a561671a806a2841\",\"flash\":[]}'),('5I3m_xvnkfChP49Fz9IfS8x00om8shQo',1791996884860,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:44.860Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"b6670f591ec3541f6885d369d0f3ad6ebd92667a5235c2bd\",\"flash\":[]}'),('5LYKd2Pba_cU0Dpc5sag7TIP04Q0M_8x',1791992836511,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:16.511Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"0804429a677e2a11d2771d120cf80b14aedc01c2f53fbd18\",\"flash\":[],\"nextAfterLogin\":\"/admin/plans\"}'),('60ovaLoXm-qrhQ7SFbxj7hvgSNcVo_gT',1791993897824,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:57.824Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"ff9f34ae7e43f4d4a25af0408a6da5bf58cfb26b3b684e07\",\"flash\":[]}'),('6iqWVoQc1hYM3-UzdPfrkPe6TJSKY_PE',1791992836733,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:16.733Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"c96c57fdc6fa1db56fb6ceec14109060276132d323e56690\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('6v6NkD2EAZ13g_JjgCZSFvneC7LQp-1A',1791992233141,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:37:13.141Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"717cb60a21ae8f1ad10cead3157dc8fe445e4a26516d0532\",\"flash\":[]}'),('6VMJPuWCcQ7LyIUWJcJzxQjkrg12po15',1791992834305,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:14.305Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"227f47494d1dd577b796d1bb9b8a3fea09012f401598a61a\",\"flash\":[],\"nextAfterLogin\":\"/admin\"}'),('6zsYFWC909KSkLB3MuSjykYZLFj89dpx',1792002684403,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T18:31:24.403Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"05529dd07111e20abcf45dc5f17c4ca47fcd3f2b62b298cb\",\"flash\":[]}'),('7Ic1knb8jMPNaibvhB9y4CQmIScUP9YT',1791992834108,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:14.108Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"ef7a16046d4f697432d1f9ebb1fa0b471d13b18ce998c891\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('9H1OhL4r2-9D0iquSbdjiNRmB6EWU79p',1791995926691,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:46.691Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"8766eb75e8e46b8d7199e24d55eb9ccf5d3d69cea16422a9\",\"flash\":[]}'),('asuVxlxvA0B1sYMUy2ZUOi9O8tDxkp9W',1791995926073,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:46.073Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"43ca7cf52b0d9ff3514a104448c790d36079841de7187d77\",\"flash\":[]}'),('bQEYsy-xUD-tSLMXDBYl1L2PcTfFQzFk',1791998035520,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:13:55.520Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"c6a356b3d26aff53dc7e5667d58590c2f2810e7e7580c417\",\"flash\":[]}'),('BVr_S6PQVG7IfRbn4uCqJc376_NsHfgf',1791991340716,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:22:20.716Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"4aea029af76c81074819509a4bde4ca470f3f45fb5bfe349\",\"flash\":[]}'),('bVVaxVP15nwoPHS1KCTkwnQxdwTAjp-_',1791998513416,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:21:53.416Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"2d5b23c1b6abd2c01d640e621ab0fe31f4f473a5c77ec86b\",\"flash\":[]}'),('CaysX5w1efGHjSPT1J_CVauXNoGyRSuQ',1791998537506,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:17.506Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"5af7b014ee49b932a357ac548be4ec120d05c5da6532fedb\",\"flash\":[]}'),('cRJP-NGzTACjZGIGDmInYN1n5hGKEMzK',1791991714947,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:28:17.426Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"221f4a692b211c3571b1bf9eb0f6a051361b64ef7d9e0c6e\",\"flash\":[]}'),('D1PQaL8zz-A3U3b0eX6JabBOFqfb24Bq',1791992835299,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:15.299Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"c5d442ced2517b60ced2f8e9f0e366f06405b14d6ab89bf3\",\"flash\":[],\"nextAfterLogin\":\"/admin/classes\"}'),('DHGvnSZkzVNiXJzHPLu8IJcWj8kNwE07',1791996889898,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:49.898Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"821a6670b17380052b3781e2e2b3b35927caad124178fe7a\",\"flash\":[]}'),('DHuFPU3CbHr6YOF_ls_tE1rIPUN9Xvsq',1791994483672,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:14:43.672Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"3e8656ce3c8ffb0a1b740f8628ab601e8bbae9626987d33d\",\"flash\":[]}'),('dRcn1QlR6XvVgkHjxGTnJWNj5a3__JVe',1791993205793,'{\"cookie\":{\"originalMaxAge\":1209599999,\"expires\":\"2026-10-14T15:53:25.793Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"ef8f7df06f0fda587a14e90700a25fd1407ef7d6aeccbeef\",\"flash\":[]}'),('Dv7btYjYn8sihYUkmvVomHuVeRqebntH',1791993898586,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:58.586Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"6b603fb95e30a2db171e2e1e7230ea08866ac9ccf16b1af2\",\"flash\":[]}'),('E7_NJOWkkaAfdH46h_vCOtfVwdToAIwq',1791992833005,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:13.005Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"6f72fe7f1b200378e1bc22e1e92a6de0ba60773d63c5a5aa\",\"flash\":[]}'),('EE0zUEGBtlL4hoMDMSCkJqYrkLy8nE79',1791992833899,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:13.899Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"f306b6d1b5d417fb88f6eee7808cd2fa49e63931ca5e3a2e\",\"flash\":[]}'),('EFZkDEI60vHTYiqL15oAHkRLrrum2bQU',1791995022334,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:11:45.648Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"1c00fff161b0de2472f6a4838cafca05c20d76adc18c14cb\",\"flash\":[]}'),('EhMHsh56fwPjESgBlZ8OxTASsNTk_6ji',1791997835018,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:09:37.917Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"8a12a48461704b77a37c8f608f03c8c20f82bf997c8888c9\",\"flash\":[]}'),('eSkEam9ejaWyGCnlmkAmvkFwgo3k1qv6',1791992268588,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:37:48.588Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"d6d53fc3666b33b429068c6e058b6baab7cf5eb9f71c5c9e\",\"flash\":[]}'),('F1ryd9jOXYt86DM_AAS-gs3Eg3M-PIpe',1791998579281,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:59.281Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"b45522556e418d8c6919f81fe2838634a9adfd5c0e9a04b7\",\"flash\":[]}'),('FBUuxo44LSYlrks-60ihRPH_w3PzVeD2',1791992834739,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:14.739Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"138965bee90ba818f0911c1b6c983af4d0b141a25ca83566\",\"flash\":[],\"nextAfterLogin\":\"/admin/settings\"}'),('g9ZZ2WJXTOqDzl6u-gDXqWdvBVwDktcs',1791992283487,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:38:03.487Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"1e00fc5f579e16a70413d6d10c8ffaabfbd249ddeb2a201f\",\"flash\":[]}'),('gh-fJcegvraV9OoxO414ZS49V3T72eyn',1791996890143,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:50.143Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"9f7139f23c6122dc1259592a0fe8791a7c91b05082520b65\",\"flash\":[]}'),('GZCPOatsAqxSI4AUubVDAEF8BDW199Jy',1791990882480,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:14:42.480Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"302e0be2d98b12d5e58b6293462c8abc160c906714f70cc9\",\"flash\":[]}'),('h5s225FxOS11b5JGXHCEEtzPKFTOt2hz',1791997337830,'{\"cookie\":{\"originalMaxAge\":1209599999,\"expires\":\"2026-10-14T17:02:17.830Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"e551837780ecd03944fdf90b464396e524080b805b969da0\",\"flash\":[]}'),('HcXUug1LSKastfBbIjyNGDM1JZ2FgN5N',1791992836964,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:16.964Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"354489c0685f41d88115d82db623ac62fa5a3e8f8db8fb69\",\"flash\":[],\"nextAfterLogin\":\"/admin/members\"}'),('ifknlRK_nQZ9tKQF5zs92h1iMuyxwZLp',1791990882507,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:14:42.507Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"3b45508a178e6235f6e72016a7a28eacb2e821057009448a\",\"flash\":[]}'),('IGPlSzm2GDBsVHbRFmmt3NfoCai3apQZ',1791992837394,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:17.394Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"7fce716844c3d29054f1356562d65dbfc20dc292c1ea4bde\",\"flash\":[],\"nextAfterLogin\":\"/admin/bookings\"}'),('IWLGQmoajHjtBjnkk7X_qiY_tpBIhjr0',1791991334597,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:22:14.597Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"8cf6d1143aabd5415ac6ac4cb98410f4d2362527e272a9c1\",\"flash\":[]}'),('iZAGL4Vs09HNbSOQmAIcUzMX_UBI2lzR',1791997758181,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:09:16.248Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"35ff20b4e9e1e10668294c9456142421be0b44c95974bfda\",\"flash\":[]}'),('J_eDJddc7o4_lLYxO48153vnTPKnVkpV',1792002436288,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T18:27:16.288Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"36c988ffd3502fc1445d5e027a3bf771d681ab6e98a9fc64\",\"flash\":[]}'),('JHHia35G1LIxri8QdAd-HYVrMLK2q2SA',1791994490398,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:14:50.398Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"931e260ff53d68ee11c46ce8a8f066e6d21a388b12e8c36d\",\"flash\":[]}'),('JOZN5J9O25IaPdX-bM1DMW_ZbLqLEwbG',1791995926993,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:46.993Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"91184cb6c67ac160bc4dfe9e32c49ced3ca20bfcc659b8eb\",\"flash\":[]}'),('JVAInRofLBrhslItVPNLDWtztgMawaen',1791995927606,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:47.606Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"e37b444a6b7f8bd7fd3968325f18f7f13013615ca01ca1fe\",\"flash\":[]}'),('khYWHKdXNKytAzvLU7PLGBTjLz8ee1OJ',1791998548236,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:28.236Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"7b78c04dfca1a75113a29a5cc834c954e20b3cd009daecef\",\"flash\":[]}'),('L_S_fLLYMMWx1yqgS4LViM5DOeHOzUWk',1791990163823,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:02:43.823Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"bae4ef769a4c772ffa65d96384acabb95b9a937017e526ce\",\"flash\":[]}'),('L1Fw10sAaIK2NxDivEpr6Np2aMfsAE7N',1791992833700,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:13.700Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"bc84347bfef6c30a1c60e44aba60368b524350633b6b5c15\",\"flash\":[]}'),('l3JA_qvEi1j9k4hSJ7setah93lrfKN59',1791992836290,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:16.290Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"9ad0edd399dc76a9e588e57f5e60808e499beb62eadf2e72\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('LjVhtRBaKnDO6nRni4GQbpOTTzm5dIIJ',1791993931894,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:05:31.894Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"b2732975fe458ea8629b0bbca40b3afd0c4fc627daa9d4b5\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('LVgzFTN0LO9M3NnWYjGEmnbpOIAu77rj',1791992837182,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:17.182Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"c44ff3273067e1c2f3557764c7bc7aa588cf37e10b343ec8\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('lYd5l9pA_0Q3WOdyUR_3sOZdJVvmo6J8',1791992832440,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:12.440Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"135d5ec94da89aacc6e9cb8662d1105f2c3a8f7790e95b8e\",\"flash\":[]}'),('M3kcc8Ye69WHhMglDk8CY85Jkoe7zBlv',1791997998889,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:13:18.889Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"727a1e30d5c14fa96527173d47d7e782ecfb88189c49348c\",\"flash\":[]}'),('McjGIOgCk1jUggCFXvvOzymQNGcIdCG5',1791995671095,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:34:31.095Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"9b787ba88a8240d6a4e8c2964bddef62343b7b45e6339128\",\"flash\":[]}'),('MGv8vI1NXP66lGDXBM8sF0RKhGnNJ8Nf',1791998160427,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:16:00.427Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"8322fdc627de367638b804913c2bc2a48284c11de904b365\",\"flash\":[]}'),('O_U-p1h2inqd0Fl6oXgXAw4P7A5vCEBE',1791998529219,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:09.219Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"13e65a8da0c12433949b1c3faa5694bb8adebd7c5b928cb0\",\"flash\":[]}'),('ofMs8wrl54twpwqut3k0pDK0qp0qkn4y',1791996890648,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:50.648Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"fac89b839c5b47b39bb028c596fb9b3169c7eef07b984d06\",\"flash\":[]}'),('OfRlC6bMudABy9P9webNZMAV5UoDJ4bs',1791992832730,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:12.730Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"b83a725388b616c7e070d4f1863478dba42888208b931ece\",\"flash\":[]}'),('p9Cfh57OQPcspGj7Z38CRop5uvFrdiI0',1791997018375,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:56:58.375Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"253de40b79b7832e9a886c44c617692ae578250c6c70ac30\",\"flash\":[]}'),('pCNFMI8iG5QI9-f-Fg723H-4guZIEMcz',1791990882498,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:14:42.498Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"0e49efe7ee8f9d8c7162bf86ce9d4bed7bf7724e25398bf9\",\"flash\":[]}'),('Pm5fo7c0pgyLsnRVFTpTawK5xHeTv7DC',1791998578305,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:58.305Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"e63a5f5b44e446d9f647fd544d3903f2323d7a284bd64ab7\",\"flash\":[]}'),('pPB2h3D49HXvSlvbQyvaM8GVDZ8K8V9L',1791993898769,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:58.769Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"5a97144584286e57d41bdbc947a091609bb28f8696217e98\",\"flash\":[]}'),('Py38W1BhXM94Yx6vo8M3gGZnBB7cUDyg',1791992231001,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:37:11.001Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"c5e707f758de8a315d9f6a5d8df7cbb253937e042813a9fd\",\"flash\":[]}'),('PYtviIq3LVv0q_FLycXRpimZjUYSBYB1',1791993896686,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:56.686Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"632cb48dad98b246041c3cac29ecb9dce40ab541a8735e0f\",\"flash\":[]}'),('qA70PPFHPzAlZsr-xuM1jF8KFu288KrS',1791992833493,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:13.493Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"7af9113da3ae03892326f6b90de00f1fdeb67ca72f292e30\",\"flash\":[]}'),('qb79ftGu2kJ39LW-E1JUl9TWrmtI81ur',1791990882465,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:14:42.465Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"f94fe20e1e3f246a99409fe2c276cbe81b74ca0a93b3de60\",\"flash\":[]}'),('qjqBK-e6nuc8FIhR3XBNrrKg4DTwQ59p',1791993897515,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:57.515Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"d66a3a7da73ea6d67a6d8e07463d4587ae0c9fe093de884a\",\"flash\":[]}'),('qQylVLRW9Nbo0VlHPhxjtLh6DBjXSbqv',1791998578795,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:58.795Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"980a71718071cf565ffd9132af75ee981d499448a92f3a72\",\"flash\":[]}'),('QQYxEmShVILhw8uVk2qq1MA9_xzgSE1l',1791997935607,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:12:15.607Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"2eb8845eadb1e3b40c67eb908361cabbdd55f1de4f2a3499\",\"flash\":[]}'),('QuJkwspcVgp5DbdSVxByrR7dg4z2dhqw',1791992296350,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:38:16.350Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"44ee4fcc4ab7075b8771fb44b113e8dad1b648b6daca47a2\",\"flash\":[]}'),('sgpyzJnKoWA54X8UA5HH4NGP-FqaL9rb',1791992831844,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:11.844Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"50b3fd07bc81ebe89b68f95d07d0d9d6360501b97ee193fd\",\"flash\":[]}'),('T_XLC6r2d6pDohqWijVketEgfJz66RQP',1791998504102,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:21:44.102Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"b706d80647c43efcb5675bcdb4c49f33e33d96f133a0a474\",\"flash\":[]}'),('T55rM_PLEuJuuTswJaOgiIhqxduyAm_J',1791998577554,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:57.554Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"d80d82abf31bafe90ee07744101b587023273e782d7ae929\",\"flash\":[]}'),('T6O9DLfimvqUnJS7sh_y25Si8op9qzFc',1791992836006,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:16.006Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"172c12faddf25df18f609e3aea2d270da6324a5b8db5bff6\",\"flash\":[],\"nextAfterLogin\":\"/admin/trainers\"}'),('TIXBV1C7-ZTCaPpI3Yk390YFOHc0POIj',1791996890308,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:50.308Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"48b818cdafdd80a039d58af879f684f288f9bf5595169668\",\"flash\":[]}'),('towOH6IHSk5qLNv36uqwVt1U5zGJFTWJ',1791995928226,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:48.226Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"c878bec1ecc121abb1c0754b0175441d36867a09b29323a5\",\"flash\":[]}'),('TXoo_P_ycUSQr6i_Fapm2szfFN66mNtC',1791992835743,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:15.743Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"d19dc0f089aa2b2a0d5091845f73c880e312fbea8195d146\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('tYuwZSfH79Cas1EjPTjEgUOfMhcemjLe',1791996889612,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:49.612Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"5b3129c6fb271f2c35eb30c371b6963783a5eca15ca8166a\",\"flash\":[]}'),('uLudpZD8IN_e-9MwL2Y9Mjv1uZhLsgWm',1791995928035,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:48.035Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"29ae5c66a61d6e0e98279c8cb20b923171e6a01ea07941fe\",\"flash\":[]}'),('uStjTL2cLbZEkLIfv1wbO3MbHfTOjJWo',1791996889338,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:49.338Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"d8271696dc59f2458b3bd52e0b8c8152c66195f9c276b281\",\"flash\":[]}'),('v3a1lzagBgXYwDjrKpC2FF6jk-MuQrVe',1791992834497,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:47:14.497Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"9cf99316e304c2a6169101691f05524c54d0b3b7e12e9b47\",\"flash\":[{\"type\":\"error\",\"msg\":\"Please log in to continue.\"}]}'),('vckDlm9sViRtpTbcJ9PMjX4Yb5cgsfkd',1791997492671,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:04:39.555Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null,\"csrf\":\"4a5021058bf7f95ae55c2744aa5f1973c765a37939ebd136\",\"flash\":[]}'),('W5-E_KMOJantuypecH0-Y_QmgRYcmcUI',1791998578566,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:22:58.566Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"82925caa53ed512a0983e5796c901f951cab246d9409dbc7\",\"flash\":[]}'),('w9hPbO4QAXSUkZdyy_9uqkDtnD7lQw7k',1791996890482,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:54:50.482Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"cd60991943326abe6f22fd5088294ffc6fd37558766ebd8d\",\"flash\":[]}'),('wgOMfoJisrQglRmepvLwSFdB3BWx3w5h',1791993898385,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:58.385Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"cef5e109e253ad4450216e4c160b7cb3cf76d4964aa8380e\",\"flash\":[]}'),('wHcJzJVKBpZxV3JZXJ8rEEYNkLnryUQN',1791993897204,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:57.204Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"e21bba10a9df111b4621c93b66f192db9414885be79291f0\",\"flash\":[]}'),('wlk7G_R9Qe2JtQBEJMH30zmEZkLG3ofC',1791995927837,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:38:47.837Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"0e9d1fc779b69bb0209bfdcc0a2571d52eba6e2e5e9fed72\",\"flash\":[]}'),('WPaPkbjI6zrbYRf6Mvc2oCbtud3jZFV5',1791990882528,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:14:42.528Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"89aa2ba4c251f432a0d897a1a18126a73c7f4aa61e5a4f4d\",\"flash\":[]}'),('wWJhbcfZO1RUnaJO7Hd6B9y4t6IRtscY',1791998517977,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T17:21:57.977Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"765af12c7f6e3465aef080089b5e636d990fc42b9413194c\",\"flash\":[]}'),('XBJHoxXx9fRz4-J8w6KkBWZmy_5KoPft',1791990189346,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T15:03:09.346Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"userId\":1,\"sessionVersion\":0,\"pending2fa\":null,\"nextAfterLogin\":null}'),('xNA-UD6P99tQV_4fdJyUdn-XUw3rLIqo',1791993898178,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:04:58.178Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"73c2d6681899775dc2c3a87c403b0196ea0cd7d9b0e9ba61\",\"flash\":[]}'),('ztnKh5N0XEK84XRl0Hp1m-au5TbsqxdP',1791993924066,'{\"cookie\":{\"originalMaxAge\":1209600000,\"expires\":\"2026-10-14T16:05:24.066Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"csrf\":\"6987397b953589870cf7c3991ed30ea3ac6c3eb41d9795da\",\"flash\":[]}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `key` varchar(191) NOT NULL,
  `value` text DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('contact_email','concierge@forgefit.com'),('site_name','ForgeFit Studio'),('smtp_from','ForgeFit Studio <concierge@forgefit.com>'),('smtp_host','smtp.gmail.com'),('smtp_pass',''),('smtp_port','465'),('smtp_secure','1'),('smtp_user','');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trainers`
--

DROP TABLE IF EXISTS `trainers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `trainers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `specialty` varchar(255) NOT NULL DEFAULT '',
  `bio` text DEFAULT NULL,
  `image` varchar(255) NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trainers`
--

LOCK TABLES `trainers` WRITE;
/*!40000 ALTER TABLE `trainers` DISABLE KEYS */;
INSERT INTO `trainers` VALUES (4,'Coach Vikram Sen','Head Coach · Functional Strength & Conditioning','Former national-level powerlifter with over 10 years of coaching experience. Specializes in barbell mechanics, functional hypertrophy, and athletic conditioning. Certified CSCS and Olympic lifting coach.','/img/trainer-vikram.jpg',1,1,1790781725366),(5,'Coach Ananya Sharma','HIIT, Mobility & High-Performance Conditioning','Ex-track athlete and certified mobility specialist. Ananya crafts high-octane conditioning circuits designed to maximize cardiovascular capacity, torch calories, and bulletproof joints against injury.','/img/trainer-ananya.jpg',1,2,1790781725366),(6,'Coach Kabir Mehta','Yoga, Breathwork & Athletic Recovery','Certified 500-hour Ashtanga and Vinyasa instructor who has coached competitive athletes and fighters across India. Combines mobility flows, breath regulation, and restorative practices for optimal muscular recovery.','/img/trainer-kabir.jpg',1,3,1790781725366);
/*!40000 ALTER TABLE `trainers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'member',
  `email_verified_at` bigint(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `totp_secret` varchar(255) DEFAULT NULL,
  `totp_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `email_2fa` tinyint(1) NOT NULL DEFAULT 0,
  `session_version` int(11) NOT NULL DEFAULT 0,
  `created_at` bigint(20) NOT NULL,
  `updated_at` bigint(20) NOT NULL,
  `last_login_at` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Studio Admin','admin@forgefit.com','0000000000','scrypt$16384$8$1$UGxkvSZjxZrogYFdCdJ2Bg==$06qlm86841ERCKjf97skYbKu9Q2fUcb1zhwiQwLElIM=','admin',1790780516747,1,NULL,0,0,0,1790780516747,1790780516747,1790788976909),(3,'Alex Walker','member@forgefit.com','+91 98765 43210','scrypt$16384$8$1$pSCfKLXlDByyqm25l3AfXw==$93TA6IOkE+I1Fv9dPjQEa/aBpVXCm6yZ4hbr5DXQvqg=','member',1790781134221,1,NULL,0,0,1,1790781110080,1790781883452,1790781931104);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'forgefit'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-01  0:04:11
