/* Recipients typed straight into a send box: split on commas, spaces,
   semicolons or new lines, then sort the usable ones from the rest.

   Shared by the Send panel and Quick send so a malformed address is caught
   the same way, and described the same way, wherever it is typed. */
export function splitRecipients(raw: string, channel: string) {
  const parts = [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((x) => x.trim())
        .filter(Boolean),
    ),
  ];
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of parts) {
    const ok =
      channel === "Email"
        ? /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/.test(part)
        : /^\+?[\d][\d\s-]{6,17}$/.test(part);
    (ok ? valid : invalid).push(part);
  }
  return { valid, invalid };
}
