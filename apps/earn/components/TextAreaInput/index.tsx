import React from 'react'
import { DEFAULT_INPUT_CLASSNAME, Input, Typography } from '@dozer/ui'

interface TextAreaInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  className?: string
  label?: string
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  label,
}) => {
  return (
    <div className="flex flex-col w-full">
      {label && (
        <Typography variant="sm" weight={500} className="mb-2 text-stone-200">
          {label}
        </Typography>
      )}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={DEFAULT_INPUT_CLASSNAME}
        rows={4}
      />
    </div>
  )
}

export default TextAreaInput
