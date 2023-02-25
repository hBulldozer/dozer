import { ChevronLeftIcon } from '@heroicons/react/solid'
import { Button, IconButton, Typography } from '@dozer/ui'
import React, { Dispatch, FC, SetStateAction } from 'react'

import { NotificationGroup } from '../../NotificationCentre'
import { ProfileView } from './Profile'

interface TransactionsProps {
  setView: Dispatch<SetStateAction<ProfileView>>
}

export const Transactions: FC<TransactionsProps> = ({ setView }) => {
  return (
    <div className="">
      <div className="grid items-center h-12 grid-cols-3 px-2 border-b border-slate-200/20">
        <div className="flex items-center">
          <IconButton onClick={() => setView(ProfileView.Default)}>
            <ChevronLeftIcon width={24} height={24} className="text-slate-400" />
          </IconButton>
        </div>
        <Typography weight={600} className="text-slate-400">
          Transactions
        </Typography>
        <div className="flex items-end justify-end">
          <Button variant="empty" size="sm" className="!p-0">
            Clear all
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3 max-h-[300px] scroll">
        {/* {Object.entries(notifications).length > 0 ? (
          Object.entries(notifications)
            .reverse()
            .map(([, notifications], index) => {
              return <NotificationGroup key={index} notifications={notifications} />
            })
        ) : (
          <Typography variant="sm" className="py-5 text-center text-slate-500">
            Your transactions will appear here
          </Typography>
        )} */}
      </div>
    </div>
  )
}
