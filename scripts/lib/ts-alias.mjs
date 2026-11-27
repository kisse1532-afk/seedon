// Node로 .ts를 바로 시험할 때 "@/..." 별칭과 확장자 없는 경로를 풀어준다.
//   node --import ./scripts/lib/ts-alias.mjs scripts/test-xxx.mjs
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = new URL("../../", import.meta.url);

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const file = fileURLToPath(new URL(`${specifier.slice(2)}.ts`, root));
      if (existsSync(file)) return next(pathToFileURL(file).href, context);
    }
    return next(specifier, context);
  },
});
