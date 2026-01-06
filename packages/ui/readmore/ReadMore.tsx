import React, { useState } from 'react'
import { Typography } from '../typography'

interface ReadMoreProps {
  text: string
  maxLength?: number
  readMoreText?: string
  readLessText?: string
}

const ReadMore: React.FC<ReadMoreProps> = ({
  text,
  maxLength = 300,
  readMoreText = 'Read more',
  readLessText = 'Read less',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

    const truncatedText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
  const fullText = text

  const handleToggle = () => setIsExpanded(!isExpanded)

  return (
    <Typography variant="lg" weight={400} className="pb-16 md:pb-0">
      {isExpanded ? (
        <p>{fullText}</p>
      ) : (
        <>
          <p>{truncatedText}</p>
          {text.length > maxLength && (
            <button onClick={handleToggle}>
              <Typography variant="lg" weight={400} className="cursor-pointer hover:text-stone-50 text-stone-600">
                {readMoreText}
              </Typography>
            </button>
          )}
        </>
      )}
      {isExpanded && (
        <button onClick={handleToggle}>
          <Typography variant="lg" weight={400} className="cursor-pointer hover:text-stone-50 text-stone-600">
            {readLessText}
          </Typography>
        </button>
      )}
    </Typography>
  )
}

export default ReadMore
