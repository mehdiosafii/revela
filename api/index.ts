import { handle } from "hono/vercel";
import app from "../server/app";

// Single Vercel serverless function handling all /api/* traffic.
export default handle(app);
