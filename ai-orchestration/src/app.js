import express from "express";

const app = express();

app.use(express.json());

app.get("/api/status/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
