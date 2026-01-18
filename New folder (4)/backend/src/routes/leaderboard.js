import { Router } from "express";
import { pool } from "../db.js";

const r = Router();

r.get("/", async (req, res) => {
  const tournamentId = Number(req.query.tournamentId || 1);

  const [rows] = await pool.query(
    `SELECT t.id AS teamId, t.team_name AS teamName,
            COALESCE(SUM(r.kills),0) AS totalKills,
            COALESCE(SUM(r.points),0) AS totalPoints
     FROM teams t
     LEFT JOIN results r ON r.team_id=t.id AND r.approved=1
     WHERE t.tournament_id=? AND t.approved=1
     GROUP BY t.id
     ORDER BY totalPoints DESC, totalKills DESC, teamName ASC`,
    [tournamentId]
  );

  res.json({ ok:true, leaderboard: rows });
});

export default r;
