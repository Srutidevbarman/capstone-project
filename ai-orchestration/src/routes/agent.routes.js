import { Router } from "express";
import { de } from "zod/v4/locales";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
  try {
    const { message, projectId } = req.body;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemMessage = `You are an expert developer. Your task is to help create and modify project files using the available tools.

IMPORTANT: You MUST use the tools to actually create or modify files. Do not just provide instructions.
- Use update_files tool to create new files or modify existing ones
- Use list_files tool to see what files already exist
- Use read_files tool to check file contents
- Always execute the actual file creation/modification operations

When creating a project, use update_files to actually create all the necessary files with their full content.`;

    const response = await agent.stream(
      {
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: message },
        ],
      },
      {
        context: {
          projectId,
        },
        streamMode: "custom",
      },
    );

    // const chunks = [];
    for await (const chunk of response) {
      // chunks.push(chunk);
      console.log(chunk);
      res.write(`data: ${chunk}\n\n`);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("error invoking agent :", error);
    res.status(500).json({
      error: "failed invoke agent",
      message: error.message,
      stack: error.stack,
    });
  }
});

export default agentRouter;
