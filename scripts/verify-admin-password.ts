import { verifyAdminPassword } from "../lib/admin-password.ts";
import { stdin as input, stdout as output } from "node:process";

function readHidden(prompt: string) {
  return new Promise<string>((resolve) => {
    output.write(prompt);
    if (!input.isTTY || !input.setRawMode) {
      input.once("data", (value) => {
        output.write("\n");
        resolve(String(value).trimEnd());
      });
      return;
    }
    let value = "";
    input.setRawMode(true);
    input.resume();
    const onData = (chunk: Buffer) => {
      const character = chunk.toString();
      if (character === "\u0003") process.exit(130);
      if (character === "\r" || character === "\n") {
        input.setRawMode(false);
        input.off("data", onData);
        output.write("\n");
        resolve(value);
      } else if (character === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += character;
      }
    };
    input.on("data", onData);
  });
}

async function main() {
  const password = await readHidden("Senha (nao sera gravada): ");
  const storedHash = process.env.ADMIN_PASSWORD_HASH?.trim() || "";
  console.log(
    `Password valid: ${await verifyAdminPassword(password, storedHash)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
