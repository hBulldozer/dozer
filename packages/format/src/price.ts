import numeral from 'numeral'

export const formatUSD = (value: string | number, inputString = '$0.00a') => {
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
