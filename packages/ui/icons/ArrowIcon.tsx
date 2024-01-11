import React from 'react'

export const ArrowIcon = (props: React.ComponentProps<'svg'>) => {
  return props.type == 'up' ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-label="up"
      {...props}
    >
      <path
        d="M13.3021 7.7547L17.6821 14.2475C18.4182 15.3388 17.7942 17 16.6482 17L7.3518 17C6.2058 17 5.5818 15.3376 6.3179 14.2475L10.6979 7.7547C11.377 6.7484 12.623 6.7484 13.3021 7.7547Z"
        fill="currentColor"
      ></path>
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="down"
      {...props}
    >
      <path
        d="M10.6979 16.2453L6.31787 9.75247C5.58184 8.66118 6.2058 7 7.35185 7L16.6482 7C17.7942 7 18.4182 8.66243 17.6821 9.75247L13.3021 16.2453C12.623 17.2516 11.377 17.2516 10.6979 16.2453Z"
        fill="currentColor"
      ></path>
    </svg>
  )
}
