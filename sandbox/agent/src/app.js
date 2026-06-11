import express from "express";
import fs from "fs";
import morgan from "morgan";
const app = express();

const WORK_DIR = "/workspace";
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from the agent!", status: "success" });
});

app.get("/list-files", async (req, res) => {
  const elements = await fs.promises.readdir(WORK_DIR);

  res.status(200).json({
    message: "Elements in working directory",
    elements,
    status: "success",
  });
});

export default app;
