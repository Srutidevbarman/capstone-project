import express from "express";
import cors from "cors";
import agentRouter from "./routes/agent.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/status/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/ai", agentRouter);

export default app;
