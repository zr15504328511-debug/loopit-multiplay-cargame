import fs from "node:fs";
import { NativeTerrain } from "../src/native-terrain.js";
const publicRoot = new URL("../public/", import.meta.url);
const read = async (url, kind) => {
  const data = fs.readFileSync(new URL(url.replace(/^\//, ""), publicRoot));
  return kind === "json" ? JSON.parse(data.toString("utf8")) : data;
};
export async function loadTestLevel(level) {
  if (level.surfaceFile)
    level.surfaceTriangles = (await read(level.surfaceFile, "json")).triangles;
  if (level.nativeEnvironment) {
    level.nativeTerrain = await NativeTerrain.load(
      level.nativeEnvironment,
      read,
    );
    level.instances = level.nativeTerrain.instances;
  }
  return level;
}
