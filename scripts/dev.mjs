import { spawn } from "node:child_process";

const input = process.argv.slice(2);
let host = "0.0.0.0";
let port = "3000";
const passthrough = [];

for (let index = 0; index < input.length; index += 1) {
  const argument = input[index];
  if ((argument === "--host" || argument === "--hostname" || argument === "-H") && input[index + 1]) {
    host = input[index + 1];
    index += 1;
  } else if ((argument === "--port" || argument === "-p") && input[index + 1]) {
    port = input[index + 1];
    index += 1;
  } else if (argument !== "--strictPort") {
    passthrough.push(argument);
  }
}

const child = spawn("next", ["dev", "-H", host, "-p", port, ...passthrough], {
  stdio: "inherit",
  shell: process.platform === "win32"
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
