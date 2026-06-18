import { Router } from "express";
import { de } from "zod/v4/locales";
import agent from "../agents/code.agent.js";

const agentRouter = Router();

agentRouter.post("/invoke", async (req, res) => {
  try {
    const { message, projectId } = req.body;
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

    for await (const chunk of response) {
      // res.write(chunk);
      console.log(chunk);
    }
    res.json({ response });
  } catch (error) {
    console.error("error invoking agent :", error);
    res.status(500).json({ error: "failed invoke agent" });
  }
});

export default agentRouter;
