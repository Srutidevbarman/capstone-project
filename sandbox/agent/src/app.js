import express from "express";
import fs from "fs";
import morgan from "morgan";
import path from "path";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
const WORK_DIR = "/workspace";
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello from the agent!", status: "success" });
});

// @route GET /list-files
// @desc List all the files and directories and the subdirectories in the working directory and return them as json object with their relative paths to the working directory exclude directories like "node_modules" and ".git" , "dist" etc.
// -e.g. if the working directory has a file "file1.txt" and a directory "src" which has a file "file2.txt" the response should be { "files": ["file1.txt", "src/file2.txt"] }
app.get("/list-files", async (req, res) => {
  const listFiles = async (dir, basePath = "") => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".git", "dist"].includes(entry.name)) {
          continue;
        }
        const subFiles = await listFiles(fullPath, relativePath);
        files.push(...subFiles);
      } else {
        files.push(relativePath);
      }
    }
    return files;
  };

  try {
    const files = await listFiles(WORK_DIR);
    res.status(200).json({ status: "success", files });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: `Error listing files: ${err.message}`,
    });
  }
});

// @route GET /read-file
// @desc Read the content of all the files requested in the query parameter "files" and return them as json object
// -e.g. /read-file?files=file1.txt,/src/file2.txt

app.get("/read-files", async (req, res) => {
  const files = req.query.files;

  if (!files) {
    return res
      .status(400)
      .json({ message: "No files specified", status: "error" });
  }

  const fileList = files.split(",");

  const results = await Promise.all(
    fileList.map(async (file) => {
      const filePath = `${WORK_DIR}/${file}`;
      try {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return {
          [filePath.replace(WORK_DIR, "")]: content,
        };
      } catch (err) {
        return {
          [filePath.replace(WORK_DIR, "")]:
            `Error reading file: ${err.message}`,
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
        console.log(path.dirname(filePath), filePath);
        await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
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

// @route POST /create-file
// @desc creates a new file with the content specified in the request body. the req body should contain a property "files" be a json array of objects ,each object should have a "file" property specifying the file path (relative to the working directory) and a "content" property specifying the content of the file.

app.post("/create-files", async (req, res) => {
  const files = req.body.files;
  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      message:
        "Invalid request body . Expected a JSON object with a 'files' property containing an array of file objects",
      status: "error",
    });
  }
  const results = await Promise.all(
    files.map(async (file) => {
      const { file: filePath, content } = file;
      const fullPath = path.join(WORK_DIR, filePath);
      try {
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.promises.writeFile(fullPath, content, "utf-8");
        return {
          [fullPath]: "File created successfully",
        };
      } catch (err) {
        return {
          [fullPath]: `Error creating file: ${err.message}`,
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
