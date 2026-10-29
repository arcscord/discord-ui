import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../../", import.meta.url));

export async function run(command: string, args: string[], cwd: string = root): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0)
        resolve();
      else reject(new Error(`${command} failed (${signal ?? code}).`));
    });
  });
}

export async function pnpm(args: string[], cwd: string = root): Promise<void> {
  const executable = process.env.npm_execpath;
  if (!executable)
    throw new Error("Run this command through pnpm.");
  if (/\.[cm]?js$/.test(executable))
    await run(process.execPath, [executable, ...args], cwd);
  else await run(executable, args, cwd);
}
