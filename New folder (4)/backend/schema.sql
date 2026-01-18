CREATE DATABASE IF NOT EXISTS ff_tournament CHARACTER SET utf8mb4;
USE ff_tournament;

CREATE TABLE tournaments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  mode ENUM('SQUAD','DUO','SOLO') DEFAULT 'SQUAD',
  status ENUM('DRAFT','REG_OPEN','REG_CLOSED','LIVE','ENDED') DEFAULT 'REG_OPEN',
  max_teams INT DEFAULT 48,
  rules TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  team_name VARCHAR(80) NOT NULL,
  captain_name VARCHAR(80) NOT NULL,
  captain_phone VARCHAR(30) NOT NULL,
  captain_uid VARCHAR(40) NOT NULL,
  payment_paid ENUM('YES','NO') DEFAULT 'NO',
  payment_ref VARCHAR(80) NULL,
  approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_team_tournament (tournament_id, team_name)
);

CREATE TABLE players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  player_name VARCHAR(80) NOT NULL,
  ff_uid VARCHAR(40) NOT NULL,
  role ENUM('PLAYER','SUB') DEFAULT 'PLAYER',
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE TABLE matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tournament_id INT NOT NULL,
  match_no INT NOT NULL,
  stage ENUM('QUALIFIER','SEMI','FINAL') DEFAULT 'QUALIFIER',
  scheduled_at DATETIME NULL,
  room_id VARCHAR(50) NULL,
  room_pass VARCHAR(50) NULL,
  room_published TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_match (tournament_id, match_no, stage)
);

CREATE TABLE results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  match_id INT NOT NULL,
  team_id INT NOT NULL,
  placement INT NOT NULL,
  kills INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  approved TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_result (match_id, team_id)
);

INSERT INTO tournaments (title, mode, status, max_teams, rules)
VALUES ('SPIDER FF TOURNAMENT', 'SQUAD', 'REG_OPEN', 48, 'Kill=1 point. Placement points table applies.');

-- Optional demo matches
INSERT INTO matches (tournament_id, match_no, stage, scheduled_at) VALUES
(1, 1, 'QUALIFIER', '2026-01-25 19:30:00'),
(1, 2, 'QUALIFIER', '2026-01-26 19:30:00'),
(1, 3, 'QUALIFIER', '2026-01-27 19:30:00'),
(1, 1, 'FINAL',     '2026-01-28 20:00:00');
