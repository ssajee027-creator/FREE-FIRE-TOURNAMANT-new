import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import teams from "./routes/teams.js";
import matches from "./routes/matches.js";
import leaderboard from "./routes/leaderboard.js";
import tournament from "./routes/tournament.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.json({ ok:true, service:"FF Tournament API" }));

app.use("/api/tournament", tournament);
app.use("/api/teams", teams);
app.use("/api/matches", matches);
app.use("/api/leaderboard", leaderboard);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("API running on port", PORT));
