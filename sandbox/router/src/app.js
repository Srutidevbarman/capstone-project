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
function createProxy(sandboxId, target) {
  if (!proxy[sandboxId]) {
    proxy[sandboxId] = createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: true,
    });
  }
  return proxy[sandboxId];
}

app.use((req, res, next) => {
  const host = req.headers.host;
  const sandboxId = host.split(".")[0];
  const target = `http://sandbox-service-${sandboxId}`;
  const proxy = createProxy(sandboxId, target);
  return proxy(req, res, next);
});

export default app;
