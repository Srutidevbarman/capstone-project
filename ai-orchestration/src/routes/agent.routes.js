import { Router } from "express";
import { de } from "zod/v4/locales";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await agent.invoke({
      messages: [{ role: "user", content: message }],
    });
    res.json({ response });
  } catch (error) {
    console.error("error invoking agent :", error);
    res.status(500).json({ error: "failed invoke agent" });
  }
});

export default agentRouter;
