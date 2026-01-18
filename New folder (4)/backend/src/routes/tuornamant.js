import { Router } from "express";
import { pool } from "../db.js";
import { adminAuth } from "../middleware/adminAuth.js";

const r = Router();

r.get("/", async (req, res) => {
  const id = Number(req.query.id || 1);
  const [[t]] = await pool.query(`SELECT * FROM tournaments WHERE id=?`, [id]);
  res.json({ ok:true, tournament: t || null });
});

r.post("/status", adminAuth, async (req, res) => {
  const { id = 1, status } = req.body || {};
  await pool.query(`UPDATE tournaments SET status=? WHERE id=?`, [status, id]);
  res.json({ ok:true });
});

export default r;
