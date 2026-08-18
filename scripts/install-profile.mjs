// dsh-keyboard-history — profile 对接脚本（便捷工具，非必需）。
//
// 把本插件接入指定 dsh profile：写入 dependencies 与 dsh.profile.bundles，
// 然后执行包管理器安装。之后重启对应的 dsh web 实例即可加载（新 bundle 只在
// 启动时入图）。
//
// 用法: node scripts/install-profile.mjs [profileName] [pluginPath]
//   默认 profileName = web，pluginPath = 本仓库根目录。
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const profileName = process.argv[2] ?? "web";
const pluginPath = path.resolve(process.argv[3] ?? repoRoot);
const pluginName = "dsh-keyboard-history";

const profileDir = path.join(os.homedir(), ".dsh", "profiles", profileName);
const pkgPath = path.join(profileDir, "package.json");
if (!fs.existsSync(pkgPath)) {
  console.error(`profile not found: ${pkgPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const fileRef = `file:${pluginPath.replace(/\\/g, "/")}`;

pkg.dependencies = pkg.dependencies ?? {};
if (pkg.dependencies[pluginName] !== fileRef) {
  pkg.dependencies[pluginName] = fileRef;
  console.log(`dependencies.${pluginName} = ${fileRef}`);
}

pkg.dsh = pkg.dsh ?? {};
pkg.dsh.profile = pkg.dsh.profile ?? {};
pkg.dsh.profile.bundles = pkg.dsh.profile.bundles ?? [];
if (!pkg.dsh.profile.bundles.includes(pluginName)) {
  pkg.dsh.profile.bundles.push(pluginName);
  console.log(`dsh.profile.bundles += ${pluginName}`);
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`updated ${pkgPath}`);

const tool = process.platform === "win32" ? "" : "";
const hasPnpm = (() => { try { execSync("pnpm --version", { stdio: "ignore" }); return true; } catch { return false; } })();
const cmd = hasPnpm ? "pnpm install" : "npm install --no-package-lock";
console.log(`installing with: ${cmd}`);
execSync(cmd, { cwd: profileDir, stdio: "inherit" });
console.log("\nDone. Restart the dsh web instance to load the plugin (bundles enter the graph at startup).");