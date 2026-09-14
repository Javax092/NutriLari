import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export function normalizeAdminPasswordHash(storedHash: string) {
  return storedHash
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replaceAll("\\$", "$");
}

function parseStoredHash(storedHash: string) {
  const parts = normalizeAdminPasswordHash(storedHash).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [, cost, blockSize, parallelization, encodedSalt, encodedKey] = parts;
  const numbers = [Number(cost), Number(blockSize), Number(parallelization)];
  if (
    numbers.some((value) => !Number.isInteger(value) || value <= 0) ||
    !encodedSalt ||
    !encodedKey
  )
    return null;
  return {
    cost: numbers[0],
    blockSize: numbers[1],
    parallelization: numbers[2],
    encodedSalt,
    encodedKey,
  };
}

export function isValidAdminPasswordHashFormat(storedHash: string) {
  return parseStoredHash(storedHash) !== null;
}

function deriveKey(
  password: string,
  salt: Buffer,
  length: number,
  cost: number,
  blockSize: number,
  parallelization: number,
) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      length,
      { N: cost, r: blockSize, p: parallelization },
      (error, key) => {
        if (error) reject(error);
        else resolve(key as Buffer);
      },
    );
  });
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(
    password,
    salt,
    KEY_LENGTH,
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
  );
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string,
) {
  const parsed = parseStoredHash(storedHash);
  if (!parsed) return false;
  try {
    const expectedKey = Buffer.from(parsed.encodedKey, "base64url");
    const derivedKey = await deriveKey(
      password,
      Buffer.from(parsed.encodedSalt, "base64url"),
      expectedKey.length,
      parsed.cost,
      parsed.blockSize,
      parsed.parallelization,
    );
    return (
      derivedKey.length === expectedKey.length &&
      timingSafeEqual(derivedKey, expectedKey)
    );
  } catch {
    return false;
  }
}
