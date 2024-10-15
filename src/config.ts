export const PROOFS_ENABLED =
  (json(process.env.PROOFS_ENABLED as string) as boolean) || false;

function json(val: any) {
  val ??= null;
  return JSON.parse(val);
}
