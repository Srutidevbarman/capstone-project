import axios from "axios";
import { Tool } from "@langchain/tools";
import * as z from "zod";
import { describe } from "zod/v4/core";

export const listFiles = tool(
  async ({}) => {
    const response = await axios.get(
      `http://019ec0b9-9f31-70be-8c70-ac8180c3e987.agent.localhost/list-files`,
    );
    return JSON.stringify(response.data.files);
  },
  {
    name: "list_files",
    description:
      "List all the files and directories and the subdirectories in the working directory and return them as json object with their relative paths to the working directory exclude directories like 'node_modules' and '.git' , 'dist' etc.",
    inputSchema: z.object({}),
  },
);

export const readFiles = tool(
  async ({ files: [] }) => {
    const response = await axios.get(
      `http://019ec0b9-9f31-70be-8c70-ac8180c3e987.agent.localhost/read-files`,
      {
        params: { files },
      },
    );
    return JSON.stringify(response.data);
  },
  {
    name: "read-files",
    description:
      "Read the contents of the specified files .this is useful for understanding the contents of files that are relevant to the task in hand.",
    inputSchema: z.object({
      files: z
        .array(z.string())
        .describe(
          "the List of files absolute paths to read . These should be files that were listed using the list files tool or created later",
        ),
    }),
  },
);

export const updateFiles = tool(
  async ({ files }) => {
    const response = await axios.get(
      `http://019ec0b9-9f31-70be-8c70-ac8180c3e987.agent.localhost/update-files`,
      {
        updates: files,
      },
    );
    return JSON.stringify(response.data.results);
  },
  {
    name: "update_files",
    description:
      "update the contents of specified files . This is useful for making chnages to  files based on  the requirments of the task at hand",
    inputSchema: z.object({
      files: z
        .array(
          z.object({
            file: z
              .string()
              .describe("the absolute path of the file to update"),
            content: z.string().describe("the new content for the file"),
          }),
        )
        .describe("the list of files to update and their new contents"),
    }),
  },
);

export const createFiles = tool(
  async ({ files }) => {
    const response = await axios.post(
      `http://019ec0b9-9f31-70be-8c70-ac8180c3e987.agent.localhost/create-files`,
      { files },
    );
    return JSON.stringify(response.data.results);
  },
  {
    name: "create-files",
    description:
      "Create one or more files in the agent workspace. Each item must include 'file' (relative path) and 'content' (string).",
    inputSchema: z.object({
      files: z
        .array(
          z.object({
            file: z
              .string()
              .describe("the relative path of the file to create"),
            content: z.string().describe("the content for the new file"),
          }),
        )
        .describe("the list of files to create and their contents"),
    }),
  },
);
