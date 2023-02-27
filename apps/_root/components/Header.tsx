import { ChevronDownIcon } from '@heroicons/react/solid'
import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC } from 'react'
export const Header: FC = () => {
  return (
    <App.Header withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">
        <Link.Internal href="/swap" passHref={true}>
          <Button as="a" size="sm" className="ml-4 whitespace-nowrap">
            Enter App
          </Button>
        </Link.Internal>
      </div>
    </App.Header>
  )
}
