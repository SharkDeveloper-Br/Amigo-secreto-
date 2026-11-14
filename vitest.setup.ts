import { execSync } from "node:child_process";

export default function setup() {
  const url = process.env.DATABASE_URL_TEST ?? "postgresql://app:app@localhost:5432/amigo_test";
  process.env.DATABASE_URL = url;
  execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url }, stdio: "ignore" });
}
