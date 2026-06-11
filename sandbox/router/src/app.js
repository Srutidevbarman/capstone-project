import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
const app = express();

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/status/healthz", (req, res) => {
  res.status(200).send("OK");
});
app.get("/api/status/readyz", (req, res) => {
  res.status(200).send("OK");
});
const proxy = {};
const agentProxy = {};

function getPreviewProxy(sandboxId) {
  const target = `http://sandbox-service-${sandboxId}`;
  if (!proxy[sandboxId]) {
    proxy[sandboxId] = createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
    });
  }
  return proxy[sandboxId];
}
function getAgentProxy(sandboxId) {
  const target = `http://sandbox-service-${sandboxId}:3000`;
  if (!agentProxy[sandboxId]) {
    agentProxy[sandboxId] = createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
    });
  }
  return agentProxy[sandboxId];
}

app.use((req, res, next) => {
  const host = req.headers.host;
  const sandboxId = host.split(".")[0];

  if (host.split(".")[1] === "agent") {
    return getAgentProxy(sandboxId)(req, res, next);
  } else if (host.split(".")[1] === "preview") {
    return getPreviewProxy(sandboxId)(req, res, next);
  }
});

export default app;
