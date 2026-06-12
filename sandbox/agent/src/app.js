import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";

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

// @route GET /read-file
// @desc Read the content of all the files requested in the query parameter "files" and return them as json object
// -e.g. /read-file?files=file1.txt,/src/file2.txt

app.get("/read-file", async (req, res) => {
  const files = req.query.files;

  if (!files) {
    return res
      .status(400)
      .json({ message: "No files specified", status: "error" });
  }

  const fileList = files.split(",");

  await Promise.all(
    fileList.map(async (file) => {
      const filePath = `${WORK_DIR}/${file}`;
      try {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return {
          [filePath]: content,
        };
      } catch (err) {
        return {
          [filePath]: `Error reading file: ${err.message}`,
        };
      }
    }),
  );
  res.status(200).json({
    status: "success",
    files: results,
  });
});

// @route PATCH /update-file
// @desc updates the content of a file specified in the request body. the req body should contain a property "updates" be a json array of objects ,each object should have a "file" property specifying the file path (relative to the working directory) and a "content" property specifying the new content of the file.

app.patch("/update-files", async (req, res) => {
  const updates = req.body.updates;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      message:
        "Invalid request body . Expected a JSON object with an 'updates' property containing an array of update objects",
      status: "error",
    });
  }
  const results = await Promise.all(
    updates.map(async (update) => {
      const { file, content } = update;
      const filePath = path.join(WORK_DIR, file);
      try {
        await fs.promises.writeFile(filePath, content, "utf-8");
        return {
          [filePath]: "File updated successfully",
        };
      } catch (err) {
        return {
          [filePath]: `Error updating file: ${err.message}`,
        };
      }
    }),
  );

  res.status(200).json({
    status: "success",
    results,
  });
});

export default app;
