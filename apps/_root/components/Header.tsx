import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC } from 'react'
export const Header: FC = () => {
  return (
    <App.Header hide withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">
        {/* <Link.Internal href="/swap" passHref={true}>
          <Button  as="a" size="sm" className="ml-4 whitespace-nowrap">
            Enter App
          </Button>
        </Link.Internal> */}
        <Button as="a" onClick={() => console.log('clicou')} size="sm" className="ml-4 whitespace-nowrap">
          Donate
        </Button>
      </div>
    </App.Header>
  )
}
