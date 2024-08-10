import numeral from 'numeral'

export const formatUSD = (value: string | number, inputString = '$0.00a') => {
  return numeral(value).format(Number(value) < 0.01 && Number(value) != 0 ? '$0.00000a' : inputString)
}

// export const formatUSD5Digit = (value: string | number, inputString = '$0.00000a') => {
//   return numeral(value).format(inputString)
// }

export const formatHTR = (value: string | number, inputString = '0.00a') => {
  return numeral(value).format(inputString) + ' HTR'
}
