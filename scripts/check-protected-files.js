const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PROTECTED_FILE = path.join(ROOT, ".protected-files");

const protectedFiles = fs
  .readFileSync(PROTECTED_FILE, "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const staged = execSync("git diff --cached --name-only --diff-filter=ACMR", {
  cwd: ROOT,
})
  .toString()
  .split("\n")
  .map((l) => l.trim())
  .filter(Boolean);

const touched = staged.filter((f) => protectedFiles.includes(f));

if (touched.length > 0) {
  console.error(
    "\n\x1b[31mCOMMIT RECHAZADO — archivos protegidos modificados:\x1b[0m"
  );
  touched.forEach((f) => console.error(`  \x1b[31m• ${f}\x1b[0m`));
  console.error(
    "\nEstos archivos definen el aspecto y comportamiento de los videos."
  );
  console.error(
    "Si necesitas modificarlos, saca el archivo de \x1b[33m.protected-files\x1b[0m,"
  );
  console.error(
    "commitea el cambio, y luego vuelve a agregarlo a la lista.\n"
  );
  process.exit(1);
}
