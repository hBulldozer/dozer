export const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d{0,2}$`) // match escaped "." characters via in a non-capturing group, limit to 2 decimal places

export const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

// Format number input with automatic decimal point (e.g., 1234 -> 12.34)
export const formatCentsToDecimal = (input: string): string => {
  if (!input || input === '') return ''
  
  // Remove any non-digit characters
  const digits = input.replace(/\D/g, '')
  
  if (digits === '') return ''
  if (digits.length === 1) return `0.0${digits}`
  if (digits.length === 2) return `0.${digits}`
  
  // For 3+ digits, split into dollars and cents
  const cents = digits.slice(-2)
  const dollars = digits.slice(0, -2)
  
  return `${dollars}.${cents}`
}

// Convert decimal display back to cents for API (e.g., 12.34 -> 1234)
export const formatDecimalToCents = (input: string): string => {
  if (!input || input === '') return ''
  
  // Remove decimal point and ensure we have exactly 2 decimal places
  const cleanInput = input.replace(/\./g, '')
  return cleanInput.padEnd(Math.max(cleanInput.length, 2), '0')
}
