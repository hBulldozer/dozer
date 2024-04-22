import { Token } from '@dozer/currency'
import { z } from 'zod'

export declare class NCTokenBalance {
  readonly token: typeof Token
  balance: number
}
