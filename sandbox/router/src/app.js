import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
const app = express();

app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const host = req.headers.host;
  const sandboxId = host.split(".")[0];
  const target = `http://sandbox-service-${sandboxId}`;
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
  })(req, res, next);
});

export default app;
