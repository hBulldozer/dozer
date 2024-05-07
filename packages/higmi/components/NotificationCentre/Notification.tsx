import { Badge, classNames, Dots, IconButton, Link, Loader, NotificationData, TimeAgo, Typography } from '@dozer/ui'
import { Disclosure } from '@headlessui/react'
import {
  ArrowRightIcon,
  CashIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FireIcon,
  LockOpenIcon,
  PlusIcon,
  SwitchVerticalIcon,
  UploadIcon,
  XIcon,
} from '@heroicons/react/solid'
import React, { FC, useState } from 'react'
import useWaitForTransaction from './useWaitForTransaction'
import { ChainId } from '@dozer/chain'

// export const STARGATE_TOKEN = new Token({
//   chainId: ChainId.ETHEREUM,
//   address: '0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6',
//   decimals: 18,
//   symbol: 'STG',
//   name: 'StargateToken',
// })

export const Notification: FC<{
  data: string
  showExtra?: boolean
  hideStatus?: boolean
}> = ({ data, showExtra = false, hideStatus = false }) => {
  const notification: NotificationData = JSON.parse(data)
  const status = useWaitForTransaction(notification.txHash, notification.chainId || ChainId.HATHOR)

  console.log(notification)
  console.log(status)
  if (!status)
    return (
      <div className="flex items-center gap-5 px-4 pr-8 rounded-2xl min-h-[82px] w-full">
        <div>
          <div className="rounded-full bg-stone-600 h-9 w-9" />
        </div>
        <div className="flex flex-col w-full gap-2">
          <div className="flex flex-col w-full gap-1">
            <div className="bg-stone-500 w-full h-[12px] animate-pulse rounded-full" />
            <div className="bg-stone-500 w-[60px] h-[12px] animate-pulse rounded-full" />
          </div>
          <div className="bg-stone-600 w-[120px] h-[10px] animate-pulse rounded-full" />
        </div>
      </div>
    )

  return (
    <div className="relative hover:opacity-80">
      {showExtra && (
        <Disclosure.Button className="absolute right-3 top-0 bottom-0 z-[100]">
          {({ open }) => {
            return (
              <IconButton as="div">
                <ChevronDownIcon
                  width={20}
                  height={20}
                  className={classNames(open ? 'rotate-180' : 'rotate-0', 'rounded-full transition-all delay-200')}
                />
              </IconButton>
            )
          }}
        </Disclosure.Button>
      )}
      {/* <Link.External
        href={notification.href ? notification.href : chains[notification.chainId].getTxUrl(notification.txHash)}
        className="!no-underline"
      > */}
      <div
        className={classNames(
          showExtra ? 'pr-10' : 'pr-4',
          'relative cursor-pointer flex items-center gap-5 rounded-2xl px-4 py-3'
        )}
      >
        <Badge badgeContent={<DownloadIcon />}>
          <div className="p-2 bg-stone-600 rounded-full h-[36px] w-[36px] flex justify-center items-center">
            {!hideStatus &&
              (status === 'pending' ? (
                <Loader size={18} />
              ) : status === 'failed' ? (
                <XIcon width={20} height={20} className="text-red-400" />
              ) : (
                <></>
              ))}
            {/* {(status === 'success' || notification.summary.info) && notification.type === 'send' && (
                <ArrowRightIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'stargate' && (
                <UICurrency.Icon currency={STARGATE_TOKEN} width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'swap' && (
                <SwitchVerticalIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'approval' && (
                <LockOpenIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'mint' && (
                <PlusIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'burn' && (
                <FireIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'enterBar' && (
                <DownloadIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'transferStream' && (
                <ArrowRightIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'transferVesting' && (
                <ArrowRightIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createMultipleStream' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createMultipleVesting' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'cancelStream' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createVesting' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'createStream' && (
                <CheckIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'updateStream' && (
                <DownloadIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'withdrawStream' && (
                <UploadIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'withdrawVesting' && (
                <UploadIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'leaveBar' && (
                <UploadIcon width={20} height={20} />
              )}
              {(status === 'success' || notification.summary.info) && notification.type === 'claimRewards' && (
                <CashIcon width={20} height={20} />
              )} */}
            {status === 'success' && <CheckCircleIcon width={20} height={20} className="text-green" />}
          </div>
        </Badge>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <Typography as="span" variant="sm" weight={500} className="items-center whitespace-normal text-stone-50">
              {notification.summary.info && status == 'pending' ? (
                <Dots>{notification.summary.pending}</Dots>
              ) : status === 'failed' ? (
                notification.summary.failed
              ) : (
                notification.summary.completed
              )}
            </Typography>
          </div>
          <Typography variant="xs" className="text-stone-500">
            <TimeAgo date={new Date()} />
          </Typography>
        </div>
      </div>
      {/* </Link.External> */}
    </div>
  )
}
