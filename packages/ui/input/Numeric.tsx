import classNames from 'classnames'
import React, { forwardRef, useState, useEffect } from 'react'

import { DEFAULT_INPUT_CLASSNAME, ERROR_INPUT_CLASSNAME } from './index'
import { escapeRegExp, inputRegex, formatCentsToDecimal } from './utils'

const defaultClassName = 'w-0 p-0 text-2xl bg-transparent'

export type NumericProps = Omit<React.HTMLProps<HTMLInputElement>, 'onChange' | 'as' | 'value'> & {
  onUserInput?: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  variant?: 'default' | 'unstyled'
  autoDecimal?: boolean // New prop to enable automatic decimal formatting
  useLocaleFormat?: boolean // New prop to enable locale-based number formatting (thousands separators)
  value?: string | number
}

export const Input = forwardRef<HTMLInputElement, NumericProps>(
  (
    {
      value,
      onUserInput,
      placeholder = '0',
      className = defaultClassName,
      title = 'Token Amount',
      inputMode = 'decimal',
      type = 'text',
      pattern = '^[0-9]*[.,]?[0-9]*$',
      min = 0,
      minLength = 1,
      maxLength = 79,
      variant = 'default',
      error,
      autoDecimal = false,
      useLocaleFormat = false,
      ...rest
    },
    ref
  ) => {
    // Store the display value with locale formatting
    const [displayValue, setDisplayValue] = useState(value)

    // Format number with locale formatting (thousands separators)
    const formatNumberWithLocale = (numString: string | number): string => {
      if (!numString || numString === '') return ''

      // Remove any existing thousands separators
      const cleaned = String(numString).replace(/,/g, '')

      // Split into integer and decimal parts
      const parts = cleaned.split('.')
      const integerPart = parts[0]
      const decimalPart = parts[1]

      // Format integer part with thousands separators
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

      // Reconstruct the number
      return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger
    }

    // Remove locale formatting to get raw value
    const removeLocaleFormat = (formattedString: string): string => {
      return formattedString.replace(/,/g, '')
    }

    // Update display value when the value prop changes
    useEffect(() => {
      if (useLocaleFormat && value) {
        setDisplayValue(formatNumberWithLocale(value))
      } else {
        setDisplayValue(value)
      }
    }, [value, useLocaleFormat])

    const enforcer = (nextUserInput: string) => {
      if (autoDecimal) {
        // For auto-decimal mode, only allow digits and limit to reasonable length
        const digitsOnly = nextUserInput.replace(/\D/g, '')
        if (digitsOnly.length <= 6) {
          // Max 6 digits (e.g., 123456 -> 1234.56)
          const formattedValue = formatCentsToDecimal(digitsOnly)
          if (onUserInput) {
            onUserInput(formattedValue)
          }
        }
      } else {
        // Remove locale formatting before validation
        const rawInput = useLocaleFormat ? removeLocaleFormat(nextUserInput) : nextUserInput

        // Original validation logic with 2 decimal place limit
        if (rawInput === '' || inputRegex.test(escapeRegExp(rawInput))) {
          if (onUserInput) {
            onUserInput(rawInput)
          }
        }
      }
    }

    return (
      <input
        ref={ref}
        value={displayValue}
        onChange={(event) => {
          const inputValue = event.target.value

          if (autoDecimal) {
            // For auto-decimal mode, pass the raw input to enforcer
            enforcer(inputValue)
          } else {
            if (useLocaleFormat) {
              // Allow commas as thousands separators, don't replace them
              enforcer(inputValue)
            } else {
              // Replace commas with periods, because uniswap exclusively uses period as the decimal separator
              enforcer(inputValue.replace(/,/g, '.'))
            }
          }
        }}
        // universal input options
        inputMode={inputMode}
        title={title}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        // text-specific options
        type={type}
        pattern={pattern}
        placeholder={placeholder}
        min={min}
        minLength={minLength}
        maxLength={maxLength}
        className={
          variant === 'default'
            ? classNames(DEFAULT_INPUT_CLASSNAME, error ? ERROR_INPUT_CLASSNAME : '', className)
            : className
        }
        {...rest}
      />
    )

    Input.displayName = 'Input'
  }
)
