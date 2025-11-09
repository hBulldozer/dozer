/**
 * Format a number with locale-based thousands separators
 * @param value - Number or string to format
 * @param decimals - Maximum number of decimal places (default: 2)
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumberWithLocale(
  value: number | string,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  if (value === '' || value === null || value === undefined) return '0'

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) return '0'

  return numValue.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a number with simple thousands separators (comma-based)
 * @param value - Number or string to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number | string, decimals: number = 2): string {
  if (value === '' || value === null || value === undefined) return '0'

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) return '0'

  // Format with fixed decimals
  const fixed = numValue.toFixed(decimals)

  // Split into integer and decimal parts
  const parts = fixed.split('.')
  const integerPart = parts[0]
  const decimalPart = parts[1]

  // Add thousands separators to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart?.replace(/0+$/, '')

  // Return formatted number
  if (trimmedDecimal && trimmedDecimal.length > 0) {
    return `${formattedInteger}.${trimmedDecimal}`
  }

  return formattedInteger
}

/**
 * Format currency value with dollar sign and locale formatting
 * @param value - Number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string, decimals: number = 2): string {
  const formatted = formatNumber(value, decimals)
  return `$${formatted}`
}
