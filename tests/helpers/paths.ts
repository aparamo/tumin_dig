import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const ROOT = root;
export const SNAPSHOT_PATH = path.join(root, "node_modules/.cache/tumin-test/pgdata.tar.gz");
export const MIGRATIONS_FOLDER = path.join(root, "src/db/migrations");
