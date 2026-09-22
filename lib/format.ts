// Shared display formatters. This is the single home for helpers that were
// starting to get re-implemented per page (formatTime12h existed three times).

/** 24h "13:30" → friendly "1:30 PM". */
export function formatTime12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  const h = parseInt(hStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${mStr || "00"} ${ampm}`;
}

export function cleanAddress(address: string | null | undefined): string {
  return (address || "").replace(/,?\s*Australia\s*$/i, "").trim();
}

export function addressPrimaryLine(address: string | null | undefined): string {
  return cleanAddress(address).split(",")[0]?.trim() || "";
}

export function addressLocality(address: string | null | undefined): string {
  const cleaned = cleanAddress(address);
  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return "";

  const statePattern = /\b(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\b/i;
  const stateIndex = parts.findIndex((part) => statePattern.test(part));
  if (stateIndex >= 0) {
    const localityInStatePart = parts[stateIndex].replace(statePattern, "").replace(/\b\d{4}\b/g, "").trim();
    if (localityInStatePart) return localityInStatePart;
    if (stateIndex > 0) return parts[stateIndex - 1];
  }

  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
}

export function addressRegion(address: string | null | undefined): string {
  const cleaned = cleanAddress(address);
  const regionMatch = cleaned.match(/\b(VIC|NSW|QLD|SA|WA|TAS|ACT|NT)\b/i);
  return regionMatch?.[1].toUpperCase() || "";
}

export function mapEmbedForAddress(address: string | null | undefined): string {
  const cleaned = address?.trim();
  return cleaned ? `https://www.google.com/maps?q=${encodeURIComponent(cleaned)}&output=embed` : "";
}

/**
 * Validates international and local phone numbers.
 * Supports:
 * - International E.164 (e.g. +61 412 345 678, +8801865841755, +1 555-234-5678)
 * - Local numbers (e.g. 0412 345 678, (02) 5550 1234)
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { isValid: true };
  }

  // Illegal characters check (only digits, spaces, +, -, parentheses, and dots allowed)
  if (!/^[+]?[\d\s\-().]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Phone number can only contain digits, spaces, and '+' for country code.",
    };
  }

  // Country code '+' must only be at the start
  if (trimmed.indexOf("+") > 0) {
    return {
      isValid: false,
      error: "Country code '+' must be at the beginning of the number.",
    };
  }

  const digits = trimmed.replace(/\D/g, "");

  // Length check (E.164 standard: minimum 8 digits, maximum 15 digits)
  if (digits.length < 8) {
    return {
      isValid: false,
      error: "Phone number is too short (minimum 8 digits).",
    };
  }
  if (digits.length > 15) {
    return {
      isValid: false,
      error: "Phone number is too long (maximum 15 digits).",
    };
  }

  // If starts with +, ensure country code does not start with 0 (+0 is invalid in E.164)
  if (trimmed.startsWith("+") && digits.startsWith("0")) {
    return {
      isValid: false,
      error: "Invalid international country code (cannot start with +0).",
    };
  }

  // Prevent obvious dummy sequences like "00000000" or "11111111"
  if (/^(\d)\1+$/.test(digits)) {
    return {
      isValid: false,
      error: "Please enter a real phone number.",
    };
  }

  return { isValid: true };
}

/**
 * Extracts campaign / special offer name linked to a booking reservation note.
 * Handles formats created when guests reserve via campaign CTAs:
 * - "Special Offer: XYZ"
 * - "Guest request · [Offer: XYZ]"
 */
export function parseBookingOffer(notes?: string | null): { offer: string | null; cleanNotes: string } {
  if (!notes) return { offer: null, cleanNotes: "" };
  const trimmed = notes.trim();

  // Pattern 1: "[Offer: XYZ]"
  const bracketMatch = trimmed.match(/\[Offer:\s*([^\]]+)\]/i);
  if (bracketMatch) {
    const offer = bracketMatch[1].trim();
    const cleanNotes = trimmed
      .replace(/·?\s*\[Offer:\s*[^\]]+\]/i, "")
      .replace(/^·\s*/, "")
      .trim();
    return { offer, cleanNotes };
  }

  // Pattern 2: "Special Offer: XYZ" at start
  const specialMatch = trimmed.match(/^(?:Special Offer|Offer):\s*(.+)$/i);
  if (specialMatch) {
    return { offer: specialMatch[1].trim(), cleanNotes: "" };
  }

  // Pattern 3: Inline delimiter "· Special Offer: XYZ"
  const inlineMatch = trimmed.match(/(?:^|·)\s*(?:Special Offer|Offer):\s*([^·\n]+)/i);
  if (inlineMatch) {
    const offer = inlineMatch[1].trim();
    const cleanNotes = trimmed
      .replace(/(?:^|·)\s*(?:Special Offer|Offer):\s*[^·\n]+/i, "")
      .replace(/^·\s*/, "")
      .trim();
    return { offer, cleanNotes };
  }

  return { offer: null, cleanNotes: trimmed };
}
