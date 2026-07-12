import numeral from 'numeral'

// numeral() emits the literal string "NaN" for very small magnitudes (< ~1e-6),
// regardless of the format string. Render those (and any other sub-1 value) with
// full significant digits instead, matching the chart header's approach.
const SMALL_VALUE_THRESHOLD = 1e-6

const formatSmallValue = (abs: number): string => {
  if (abs < 0.0001) return abs.toFixed(8)
  if (abs < 0.01) return abs.toFixed(6)
  return abs.toFixed(4)
}

export const formatUSD = (value: string | number, inputString = '$0.00a') => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '$0.00'

  const abs = Math.abs(num)
  if (abs > 0 && abs < SMALL_VALUE_THRESHOLD) {
    return `${num < 0 ? '-' : ''}$${formatSmallValue(abs)}`
  }

  return numeral(value).format(
    Number(value) < 1 && Number(value) > 0.1 && Number(value) != 0
      ? '$0.000a'
      : Number(value) < 0.1 && Number(value) > 0.01 && Number(value) != 0
      ? '$0.0000a'
      : Number(value) < 0.01 && Number(value) > 0.001 && Number(value) != 0
      ? '$0.00000a'
      : Number(value) < 0.001 && Number(value) != 0
      ? '$0.000000a'
      : inputString
  )
}

// export const formatUSD5Digit = (value: string | number, inputString = '$0.00000a') => {
//   return numeral(value).format(inputString)
// }

export const formatHTR = (value: string | number, inputString = '0.00a') => {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0.00 HTR'

  const abs = Math.abs(num)
  if (abs > 0 && abs < SMALL_VALUE_THRESHOLD) {
    return `${num < 0 ? '-' : ''}${formatSmallValue(abs)} HTR`
  }

  return (
    numeral(value).format(
      Number(value) < 1 && Number(value) > 0.1 && Number(value) != 0
        ? '0.000a'
        : Number(value) < 0.1 && Number(value) > 0.01 && Number(value) != 0
        ? '0.0000a'
        : Number(value) < 0.01 && Number(value) > 0.001 && Number(value) != 0
        ? '0.00000a'
        : Number(value) < 0.001 && Number(value) != 0
        ? '0.000000a'
        : inputString
    ) + ' HTR'
  )
}
