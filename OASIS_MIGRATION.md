# Oasis Contract Migration Guide

## Overview
Migration from individual pool-based Oasis contracts to DozerPoolManager-compatible Oasis contracts in the Dozer Protocol.

## Migration Context

### Changes Required
- **Smart Contract**: Migrate from `oasis_old.py` to `oasis.py` (DozerPoolManager integration)
- **API Layer**: Remove database dependency, use direct contract state calls
- **Environment Variables**: Replace database queries with `NEXT_PUBLIC_OASIS_CONTRACT_IDS` list
- **Seeding Scripts**: Update to deploy new contract version
- **Frontend**: Update to handle new contract structure and NamedTuple responses

### Key Technical Differences

#### Old Contract (`oasis_old.py`)
- Uses individual pool contracts: `dozer_pool: ContractId`
- Simple dictionary returns from view methods
- Direct pool method calls: `self.call_view_method(self.dozer_pool, "method")`
- Float-based calculations for prices
- `bytes` type for address parameters

#### New Contract (`oasis.py`)
- Uses singleton pool manager: `dozer_pool_manager: ContractId`
- NamedTuple structures (OasisUserInfo, OasisInfo, etc.) with precise field ordering
- Pool key system: `HTR_UID/token_b/fee_rate`
- Enhanced syscall usage: `self.syscall.call_view_method(self.dozer_pool_manager, "method")`
- Integer-based precision calculations with `PRICE_PRECISION = 10**8`
- `Address` type for address parameters (enhanced type safety)

### Environment Variables
- **Existing**: `NEXT_PUBLIC_POOL_MANAGER_CONTRACT_ID` (already available)
- **New**: `NEXT_PUBLIC_OASIS_CONTRACT_IDS` (comma-separated list)
- **Existing**: `OASISBLUEPRINT` (for deployment)

## Migration Progress

### ✅ Completed Tasks
1. **Analysis Phase**
   - Analyzed current Oasis integration across codebase
   - Identified all files requiring updates
   - Compared old vs new contract structures

2. **Requirements Gathering**
   - Confirmed environment variable approach over database
   - Established no backward compatibility requirement
   - Identified existing pool manager contract ID variable

3. **API Layer Updates**
   - ✅ Updated `/packages/api/src/router/oasis.ts` to use environment variables
   - ✅ Removed database dependencies from all endpoints
   - ✅ Updated contract interaction methods for new NamedTuple structures
   - ✅ Added support for new contract fields (pool_fee, protocol_fee)

4. **TypeScript Wrapper Updates**
   - ✅ Updated `/packages/nanocontracts/src/oasis/index.ts` constructor
   - ✅ Updated initialize method for DozerPoolManager integration
   - ✅ Updated user_deposit method for Amount-based pricing
   - ✅ Updated wc_initialize method parameters

5. **Seeding Script Updates**
   - ✅ Updated `/seed_config.ts` with new OasisConfig interface
   - ✅ Added pool fee and protocol fee to Oasis configurations
   - ✅ Updated `/packages/nanocontracts/src/seed_nc.ts` deployment logic
   - ✅ Added Oasis contract deployment section
   - ✅ Added environment variable output for NEXT_PUBLIC_OASIS_CONTRACT_IDS

6. **Environment Variable Setup**
   - ✅ Added NEXT_PUBLIC_OASIS_CONTRACT_IDS to .env files
   - ✅ Updated seeding script to output contract IDs

### ✅ Frontend Compatibility Analysis
7. **Frontend Component Analysis**
   - ✅ Verified existing API calls in frontend match updated structure
   - ✅ Confirmed data field compatibility maintained
   - ✅ Identified that new fields (fee_amount, protocol_fee) are available but not displayed
   - ✅ No breaking changes required in frontend components

### ✅ Completed Tasks (Continued)
8. **Frontend Compatibility Issues**
   - ✅ Fixed API response structure to include token information
   - ✅ Added token metadata fetching from Hathor node
   - ✅ Updated data mapping to match frontend expectations
   - ✅ Added backward compatibility with mock pool structure

9. **Critical Bug Fixes**
   - ✅ Fixed "substring" error by adding proper validation to fetchTokenInfo
   - ✅ Fixed missing pool_fee field by calling contract state directly
   - ✅ Added pool_manager field to API responses
   - ✅ Updated frontend Oasis constructor to use new parameters
   - ✅ Added comprehensive error handling to all API endpoints

### ✅ Final Refinements and Fixes
10. **Contract Type System Updates**
   - ✅ Updated contract to use `Address` type instead of `bytes` for address parameters
   - ✅ Enhanced type safety in contract method signatures
   - ✅ Maintained consistency with Hathor nanocontract standards

11. **API Router Optimizations**
   - ✅ Fixed user_info call format to use simple address string instead of byte format
   - ✅ Improved error handling for invalid NamedTuple responses
   - ✅ Corrected NamedTuple parsing order to match contract definitions exactly
   - ✅ Enhanced token information caching and validation

12. **NamedTuple Parser Corrections**
   - ✅ Fixed OasisInfo field order: `[total_liquidity, oasis_htr_balance, token_b, protocol_fee, dev_deposit_amount]`
   - ✅ Fixed OasisUserInfo field order: corrected `max_withdraw_b` and `max_withdraw_htr` positions
   - ✅ Fixed OasisQuoteInfo field order: corrected `fee_amount` and `deposit_amount` positions
   - ✅ All parsers now match contract NamedTuple definitions exactly

### 🎯 Migration Complete and Production Ready
The migration has been successfully completed and refined. All components are fully functional:
- ✅ API layer fully updated for DozerPoolManager integration with proper NamedTuple handling
- ✅ Contract wrapper updated for new structure with enhanced type safety
- ✅ Seeding scripts ready to deploy new contracts
- ✅ Environment variables configured and working
- ✅ Frontend compatible with new API structure and working end-to-end
- ✅ NamedTuple parsers correctly match contract definitions
- ✅ All API endpoints tested and working with deployed contracts

## Files Requiring Updates

### High Priority
- `/packages/api/src/router/oasis.ts` - API endpoints
- `/packages/nanocontracts/src/oasis/index.ts` - Contract wrapper
- `/seed_config.ts` - Seeding configuration
- `/packages/nanocontracts/src/seed_nc.ts` - Contract deployment

### Medium Priority
- `/apps/earn/pages/oasis.tsx` - Main UI
- `/apps/earn/components/OasisModal/` - Modal components
- `/apps/earn/utils/oasisOptimisticUpdates.ts` - State updates

### Configuration
- `.env` files - Add new environment variables
- `/packages/database/prisma/schema.prisma` - Remove Oasis model (if desired)

## Implementation Notes

### Critical Fixes Applied
1. **NamedTuple Field Ordering**: The most critical aspect of the migration was ensuring the NamedTuple parsers matched the exact field order defined in the contract:
   - **OasisInfo**: `[total_liquidity, oasis_htr_balance, token_b, protocol_fee, dev_deposit_amount]`
   - **OasisUserInfo**: `[user_deposit_b, user_liquidity, user_withdrawal_time, oasis_htr_balance, total_liquidity, user_balance_a, user_balance_b, closed_balance_a, closed_balance_b, user_lp_b, user_lp_htr, max_withdraw_b, max_withdraw_htr, htr_price_in_deposit, token_price_in_htr_in_deposit, position_closed]`
   - **OasisQuoteInfo**: `[bonus, htr_amount, withdrawal_time, has_position, fee_amount, deposit_amount, protocol_fee]`

2. **Address Parameter Format**: Updated from `user_info("a'${address}'")` to `user_info("${address}")` to match the contract's `Address` type expectation.

3. **Type Safety**: Enhanced contract to use proper `Address` type instead of `bytes` for better type safety and consistency with Hathor standards.

### API Changes Summary
- All endpoints now use proper NamedTuple parsing with validated field ordering
- Token metadata is fetched dynamically from Hathor node with caching
- Error handling improved for invalid contract responses
- Backward compatibility maintained through mock pool structure

## Notes
- All Oasis contracts will use the same pool manager instance
- Pool identification via pool keys instead of contract IDs
- Enhanced type safety with NamedTuple structures
- Decimal precision handled at contract level (PRICE_PRECISION)