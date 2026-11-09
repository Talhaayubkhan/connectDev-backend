const { readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const collectJavaScriptFiles = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);

    return statSync(path).isDirectory()
      ? collectJavaScriptFiles(path)
      : path.endsWith(".js")
        ? [path]
        : [];
  });

const files = ["src", "tests", "scripts"].flatMap(collectJavaScriptFiles);

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Syntax check passed for ${files.length} files.`);
