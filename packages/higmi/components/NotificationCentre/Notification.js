import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from 'react/jsx-runtime'
import { Badge, classNames, IconButton, Loader, TimeAgo, Typography } from '@dozer/ui'
import { Disclosure } from '@headlessui/react'
import { CashIcon, ChevronDownIcon, DownloadIcon, XIcon } from '@heroicons/react/solid'
// import { useWaitForTransaction } from 'wagmi'
// export const STARGATE_TOKEN = new Token({
//   chainId: ChainId.ETHEREUM,
//   address: '0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6',
//   decimals: 18,
//   symbol: 'STG',
//   name: 'StargateToken',
// })
export const Notification = ({ data, showExtra = false, hideStatus = false }) => {
  // const notification: NotificationData = JSON.parse(data)
  // const { status } = useWaitForTransaction({
  //   chainId: notification.chainId,
  //   hash: notification.txHash as `0x${string}`,
  // })
  if (!status)
    return _jsxs(
      'div',
      Object.assign(
        { className: 'flex items-center gap-5 px-4 pr-8 rounded-2xl min-h-[82px] w-full' },
        {
          children: [
            _jsx('div', { children: _jsx('div', { className: 'rounded-full bg-stone-600 h-9 w-9' }) }),
            _jsxs(
              'div',
              Object.assign(
                { className: 'flex flex-col w-full gap-2' },
                {
                  children: [
                    _jsxs(
                      'div',
                      Object.assign(
                        { className: 'flex flex-col w-full gap-1' },
                        {
                          children: [
                            _jsx('div', { className: 'bg-stone-500 w-full h-[12px] animate-pulse rounded-full' }),
                            _jsx('div', { className: 'bg-stone-500 w-[60px] h-[12px] animate-pulse rounded-full' }),
                          ],
                        }
                      )
                    ),
                    _jsx('div', { className: 'bg-stone-600 w-[120px] h-[10px] animate-pulse rounded-full' }),
                  ],
                }
              )
            ),
          ],
        }
      )
    )
  return _jsxs(
    'div',
    Object.assign(
      { className: 'relative hover:opacity-80' },
      {
        children: [
          showExtra &&
            _jsx(
              Disclosure.Button,
              Object.assign(
                { className: 'absolute right-3 top-0 bottom-0 z-[100]' },
                {
                  children: ({ open }) => {
                    return _jsx(
                      IconButton,
                      Object.assign(
                        { as: 'div' },
                        {
                          children: _jsx(ChevronDownIcon, {
                            width: 20,
                            height: 20,
                            className: classNames(
                              open ? 'rotate-180' : 'rotate-0',
                              'rounded-full transition-all delay-200'
                            ),
                          }),
                        }
                      )
                    )
                  },
                }
              )
            ),
          _jsxs(
            'div',
            Object.assign(
              {
                className: classNames(
                  showExtra ? 'pr-10' : 'pr-4',
                  'relative cursor-pointer flex items-center gap-5 rounded-2xl px-4 py-3'
                ),
              },
              {
                children: [
                  _jsx(
                    Badge,
                    Object.assign(
                      { badgeContent: _jsx(DownloadIcon, {}) },
                      {
                        children: _jsxs(
                          'div',
                          Object.assign(
                            {
                              className:
                                'p-2 bg-stone-600 rounded-full h-[36px] w-[36px] flex justify-center items-center',
                            },
                            {
                              children: [
                                !hideStatus &&
                                  (status === 'loading'
                                    ? _jsx(Loader, { size: 18 })
                                    : status === 'error'
                                    ? _jsx(XIcon, { width: 20, height: 20, className: 'text-red-400' })
                                    : _jsx(_Fragment, {})),
                                status === 'success' && _jsx(CashIcon, { width: 20, height: 20 }),
                              ],
                            }
                          )
                        ),
                      }
                    )
                  ),
                  _jsxs(
                    'div',
                    Object.assign(
                      { className: 'flex flex-col gap-0.5' },
                      {
                        children: [
                          _jsx(
                            'div',
                            Object.assign(
                              { className: 'flex items-center gap-2' },
                              {
                                children: _jsx(
                                  Typography,
                                  Object.assign(
                                    {
                                      as: 'span',
                                      variant: 'sm',
                                      weight: 500,
                                      className: 'items-center whitespace-normal text-stone-50',
                                    },
                                    { children: 'notifica\u00E7\u00E3o' }
                                  )
                                ),
                              }
                            )
                          ),
                          _jsx(
                            Typography,
                            Object.assign(
                              { variant: 'xs', className: 'text-stone-500' },
                              { children: _jsx(TimeAgo, { date: new Date() }) }
                            )
                          ),
                        ],
                      }
                    )
                  ),
                ],
              }
            )
          ),
        ],
      }
    )
  )
}
