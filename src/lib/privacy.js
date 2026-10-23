/**
 * Lightweight privacy guard.
 * Masks phone numbers, roll/enrolment numbers and card-like numbers
 * BEFORE anything is written to localStorage. No contact details are shown in the UI.
 */
export function maskSensitive(text = '') {
  let safe = String(text)

  // 10-digit Indian phones / +91 numbers (with optional spaces or dashes)
  safe = safe.replace(/(?:\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g, '••••')

  // Card-like numbers: 12–16 digits in groups of 4
  safe = safe.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}(?:[\s-]?\d{4})?\b/g, '••••')

  // Roll / registration / enrolment numbers, e.g. "Roll No: 21CS1042"
  safe = safe.replace(
    /\b(?:roll|reg(?:istration)?|enrol(?:l)?ment)\s*(?:no\.?|number|#)?\s*[:\-]?\s*[A-Z0-9][A-Z0-9/-]{3,}\b/gi,
    'roll number ••••',
  )

  // Any remaining long digit run (6+ digits) is not useful in a lost/found post.
  safe = safe.replace(/\b\d{6,}\b/g, '••••')

  return safe
}

/** True when masking actually changed the text (used for a small "private info hidden" note). */
export function hadSensitiveInfo(text = '') {
  return maskSensitive(text) !== String(text)
}
