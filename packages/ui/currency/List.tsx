import { Type, Token } from '@dozer/currency'
import React, { CSSProperties, FC, memo, ReactElement } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListChildComponentProps } from 'react-window'

interface RendererPayload {
  currency: Type
  style: CSSProperties
}

export interface ListProps {
  className?: string
  currencies: Token[]
  rowHeight?: number
  rowRenderer(payload: RendererPayload): ReactElement
  deps?: any[]
}

interface ItemData {
  currencies: Token[]
  rowRenderer: (payload: RendererPayload) => ReactElement
}

const Row = ({ index, style, data }: ListChildComponentProps<ItemData>) => {
  const { currencies, rowRenderer } = data
  const currency = currencies[index]
  return rowRenderer({ currency, style })
}

export const List: FC<ListProps> = memo(
  ({ className, currencies, rowHeight = 48, rowRenderer }) => {
    const itemData: ItemData = {
      currencies,
      rowRenderer,
    }

    return (
      <AutoSizer disableWidth>
        {({ height }) => (
          <FixedSizeList
            className={className}
            height={currencies.length * rowHeight}
            itemCount={currencies.length}
            itemSize={rowHeight}
            width="100%"
            itemData={itemData}
          >
            {Row as any}
          </FixedSizeList>
        )}
      </AutoSizer>
    )
  },
  (prevProps, nextProps) =>
    prevProps.className === nextProps.className &&
    prevProps.currencies === nextProps.currencies &&
    prevProps.rowHeight === nextProps.rowHeight
)
