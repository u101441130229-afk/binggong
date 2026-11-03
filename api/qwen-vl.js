// Compatibility endpoint for cached clients; all requests use Kimi.
import handler from "./kimi-vl.js";

export const config = { api: { bodyParser: { sizeLimit: "7mb" } } };
export default handler;
