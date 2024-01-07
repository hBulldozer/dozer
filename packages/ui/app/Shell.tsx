export interface ShellProps {
  children?: React.ReactNode
}

export function Shell({ children }: ShellProps): JSX.Element {
  return <div className="min-h-[100vh] flex flex-col">{children}</div>
}
