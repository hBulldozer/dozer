import { Button, Typography } from '@dozer/ui'
import { FC } from 'react'
import { ExternalLinkIcon } from '@heroicons/react/solid'

interface TokenLink {
  name: string
  href: string
}

interface TokenLinksProps {
  about: string
  tokenLinks: TokenLink[]
}
const TokenDetails: FC<TokenLinksProps> = ({ tokenLinks, about }) => {
  return (
    <div className="flex flex-col pb-16 md:pb-0 gap-4">
      <Typography weight={500} variant="h2">
        About
      </Typography>
      <Typography variant="lg" weight={400}>
        {about}
      </Typography>
      <div>
        <Typography className="text-neutral-400" variant="lg" weight={500}>
          Links
        </Typography>
        <div className="flex flex-wrap justify-start md:justify-start gap-x-8">
          {tokenLinks.map((link, index) => (
            <Button
              key={index}
              as="a"
              target="_blank"
              href={link.href}
              className="!p-0 "
              variant="empty"
              endIcon={<ExternalLinkIcon width={16} height={16} />}
            >
              {link.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TokenDetails
