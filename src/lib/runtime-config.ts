import path from "node:path";

export function getDataDirectory() {
  return process.env.STUDIO_DATA_DIR?.trim()
    ? path.resolve(process.env.STUDIO_DATA_DIR.trim())
    : path.join(process.cwd(), "data");
}
