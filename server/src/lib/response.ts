import { Response } from "express";

/**
 * Express 5.2.1 has a bug where res.status(N).json() and res.status(N).send()
 * send empty body for non-2xx status codes. The only reliable method is
 * res.write() + res.end() with explicit Content-Type.
 */
export function sendJson(res: Response, status: number, data: unknown) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.write(JSON.stringify(data));
  res.end();
}
