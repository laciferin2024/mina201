// import { config } from 'dotenv';

// config();

export const PROOFS_ENABLED =
  json<boolean>(process.env.PROOFS_ENABLED) || false;

function json<T>(val: any): T {
  val ??= null;
  let retVal = JSON.parse(val as string);

  console.log({ retVal });

  return retVal as T;
}
