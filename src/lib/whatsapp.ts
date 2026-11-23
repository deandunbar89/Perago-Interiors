/** A whatsapp:// link (opens the installed WhatsApp / WhatsApp Business app, not the browser) for a phone number as typed on a CV ("050 123 4567", "+971-50…", "0097150…").
 * UAE local numbers (leading 0, or 9 digits starting with 5) get the 971 code added.
 * Returns null when there aren't enough digits to be a real number. */
export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `971${digits.slice(1)}`;
  else if (digits.length === 9 && digits.startsWith("5")) digits = `971${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.startsWith("9715") && digits.length !== 12) return null; // UAE mobiles are 971 5X XXX XXXX
  return `whatsapp://send?phone=${digits}`;
}
