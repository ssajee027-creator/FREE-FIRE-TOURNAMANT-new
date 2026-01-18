import { Router } from "express";
import { pool } from "../db.js";
import { adminAuth } from "../middleware/adminAuth.js";

const r = Router();

// Register team (public)
r.post("/register", async (req, res) => {
  const {
    tournamentId = 1,
    tournamentCode, // optional, ignore for now
    teamName,
    captainName,
    captainPhone,
    captainUid,
    players, // [{name, uid}, ...]
    sub,     // {name, uid} optional
    paymentPaid = "NO",
    paymentRef = null
  } = req.body || {};

  if (!teamName || !captainName || !captainPhone || !captainUid || !Array.isArray(players) || players.length !== 4) {
    return res.status(400).json({ ok:false, error:"Missing fields: team/captain + 4 players required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // check tournament status + limit
    const [[t]] = await conn.query(`SELECT id, status, max_teams FROM tournaments WHERE id=?`, [tournamentId]);
    if (!t) throw new Error("Tournament not found");
    if (t.status !== "REG_OPEN") return res.status(400).json({ ok:false, error:"Registration closed" });

    const [[cnt]] = await conn.query(`SELECT COUNT(*) AS c FROM teams WHERE tournament_id=?`, [tournamentId]);
    if (cnt.c >= t.max_teams) return res.status(400).json({ ok:false, error:"Team slots full" });

    const [teamIns] = await conn.query(
      `INSERT INTO teams (tournament_id, team_name, captain_name, captain_phone, captain_uid, payment_paid, payment_ref)
       VALUES (?,?,?,?,?,?,?)`,
      [tournamentId, teamName.trim(), captainName.trim(), captainPhone.trim(), captainUid.trim(), paymentPaid, paymentRef]
    );

    const teamId = teamIns.insertId;

    for (const p of players) {
      if (!p?.name || !p?.uid) throw new Error("Player name/uid required");
      await conn.query(
        `INSERT INTO players (team_id, player_name, ff_uid, role) VALUES (?,?,?, 'PLAYER')`,
        [teamId, p.name.trim(), p.uid.trim()]
      );
    }

    if (sub?.name && sub?.uid) {
      await conn.query(
        `INSERT INTO players (team_id, player_name, ff_uid, role) VALUES (?,?,?, 'SUB')`,
        [teamId, sub.name.trim(), sub.uid.trim()]
      );
    }

    await conn.commit();
    res.json({ ok:true, teamId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ ok:false, error: e.message });
  } finally {
    conn.release();
  }
});

// List teams (public: approved only by default)
r.get("/", async (req, res) => {
  const tournamentId = Number(req.query.tournamentId || 1);
  const status = req.query.status; // approved|all|pending etc
  let where = `WHERE t.tournament_id=?`;
  let params = [tournamentId];

  if (!status || status === "approved") {
    where += " AND t.approved=1";
  } else if (status === "pending") {
    where += " AND t.approved=0";
  }

  const [rows] = await pool.query(
    `SELECT t.id, t.team_name, t.captain_name, t.captain_phone, t.payment_paid, t.approved, t.created_at
     FROM teams t ${where}
     ORDER BY t.created_at DESC`,
    params
  );

  res.json({ ok:true, teams: rows });
});

// Team roster (public if approved OR admin)
r.get("/:teamId/roster", async (req, res) => {
  const teamId = Number(req.params.teamId);
  const [[team]] = await pool.query(`SELECT id, team_name, approved FROM teams WHERE id=?`, [teamId]);
  if (!team) return res.status(404).json({ ok:false, error:"Team not found" });

  const isAdmin = req.headers["x-admin-token"] && req.headers["x-admin-token"] === process.env.ADMIN_TOKEN;
  if (!team.approved && !isAdmin) return res.status(403).json({ ok:false, error:"Not approved yet" });

  const [players] = await pool.query(
    `SELECT player_name, ff_uid, role FROM players WHERE team_id=? ORDER BY role ASC, id ASC`,
    [teamId]
  );
  res.json({ ok:true, team, players });
});

// Approve / reject (admin)
r.post("/:teamId/approve", adminAuth, async (req, res) => {
  const teamId = Number(req.params.teamId);
  await pool.query(`UPDATE teams SET approved=1 WHERE id=?`, [teamId]);
  res.json({ ok:true });
});

r.post("/:teamId/reject", adminAuth, async (req, res) => {
  const teamId = Number(req.params.teamId);
  // simplest: delete team
  await pool.query(`DELETE FROM teams WHERE id=?`, [teamId]);
  res.json({ ok:true });
});

export default r;
