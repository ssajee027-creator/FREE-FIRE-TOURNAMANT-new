import { Router } from "express";
import { pool } from "../db.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { totalPoints } from "../utils/points.js";

const r = Router();

// list matches (public; room hidden unless published + team approved logic kept simple)
r.get("/", async (req, res) => {
  const tournamentId = Number(req.query.tournamentId || 1);
  const [rows] = await pool.query(
    `SELECT id, match_no, stage, scheduled_at, room_published,
            CASE WHEN room_published=1 THEN room_id ELSE NULL END AS room_id,
            CASE WHEN room_published=1 THEN room_pass ELSE NULL END AS room_pass
     FROM matches WHERE tournament_id=? ORDER BY stage, match_no`,
    [tournamentId]
  );
  res.json({ ok:true, matches: rows });
});

// publish room (admin)
r.post("/:matchId/publish-room", adminAuth, async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { roomId, roomPass, publish = true } = req.body || {};
  if (!roomId || !roomPass) return res.status(400).json({ ok:false, error:"roomId & roomPass required" });

  await pool.query(
    `UPDATE matches SET room_id=?, room_pass=?, room_published=? WHERE id=?`,
    [roomId, roomPass, publish ? 1 : 0, matchId]
  );
  res.json({ ok:true });
});

// enter result (admin) -> auto points (but mark approved=1 if you want instantly)
r.post("/:matchId/result", adminAuth, async (req, res) => {
  const matchId = Number(req.params.matchId);
  const { teamId, placement, kills } = req.body || {};
  if (!teamId || !placement) return res.status(400).json({ ok:false, error:"teamId + placement required" });

  const points = totalPoints(placement, kills);

  await pool.query(
    `INSERT INTO results (match_id, team_id, placement, kills, points, approved)
     VALUES (?,?,?,?,?,1)
     ON DUPLICATE KEY UPDATE placement=VALUES(placement), kills=VALUES(kills), points=VALUES(points), approved=1`,
    [matchId, teamId, Number(placement), Number(kills || 0), points]
  );
  res.json({ ok:true, points });
});

export default r;
