import crypto from 'crypto';

/**
 * Generates a cryptographically secure temporary password.
 *
 * Requirements:
 * - 14 characters
 * - At least 2 uppercase, 2 lowercase, 2 digits, 2 special characters
 * - Fisher-Yates shuffle for randomness
 * - Uses crypto.randomBytes (CSPRNG)
 * - Never uses employee data / company name / dates
 */

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';        // Removed I, O to avoid confusion
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';          // Removed i, l, o
const DIGITS    = '23456789';                         // Removed 0, 1 to avoid confusion
const SPECIALS  = '!@#$%^&*?+=';
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIALS;

/** Returns a single random character from the given character set using CSPRNG. */
function randomChar(charset: string): string {
  const randomByte = crypto.randomBytes(1)[0]!;
  return charset[randomByte % charset.length]!;
}

/** Fisher-Yates shuffle using crypto.randomBytes. */
function secureShuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    // Generate a random index 0..i
    const randomBytes = crypto.randomBytes(4);
    const j = randomBytes.readUInt32BE(0) % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Generate a secure temporary password.
 * @param length Total password length (minimum 14, default 14).
 * @returns A random password string.
 */
export function generateTempPassword(length: number = 14): string {
  if (length < 12) {
    throw new Error('Password length must be at least 12 characters');
  }

  const chars: string[] = [];

  // Guarantee at least 2 from each required category
  chars.push(randomChar(UPPERCASE), randomChar(UPPERCASE));
  chars.push(randomChar(LOWERCASE), randomChar(LOWERCASE));
  chars.push(randomChar(DIGITS), randomChar(DIGITS));
  chars.push(randomChar(SPECIALS), randomChar(SPECIALS));

  // Fill remaining slots from the full charset
  for (let i = chars.length; i < length; i++) {
    chars.push(randomChar(ALL_CHARS));
  }

  // Shuffle so the guaranteed chars aren't always at the start
  secureShuffle(chars);

  return chars.join('');
}
