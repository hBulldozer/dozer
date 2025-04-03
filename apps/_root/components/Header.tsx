import { App, AppType, Button, Link, Menu } from '@dozer/ui'
import React, { FC } from 'react'

export const Header: FC = () => {
  return (
    <App.Header hide withScrollBackground={true} appType={AppType.Root} maxWidth="5xl" bgColor="bg-black">
      <div className="flex items-center gap-2">

        <Button as="a" href="https://forms.gle/8cEKvsaNrTP4c8Ef6" target="_blank" size="sm" className="ml-2 whitespace-nowrap bg-gradient-to-r from-yellow-500 to-amber-600 text-black">
          Join Now
        </Button>
      </div>
    </App.Header>
  )
}
