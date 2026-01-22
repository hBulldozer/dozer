import { Pair } from '@dozer/api'
import { ExtendedPair } from '../TokensTable'
import { DisplayCurrency } from '../../../TokensSection'

export interface CellProps {
  row: ExtendedPair
  displayCurrency?: DisplayCurrency
}
