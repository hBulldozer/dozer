# Pool Manager Environment Setup

After running the seeding scripts, you need to set the `POOL_MANAGER_CONTRACT_ID` environment variable in your applications.

## Steps:

1. **Run the seeding scripts** to deploy the DozerPoolManager contract:
   ```bash
   npm run seed:nc
   ```

2. **Copy the Pool Manager Contract ID** from the seeding output. Look for:
   ```
   --- POOL MANAGER CONTRACT ID ---
   [CONTRACT_ID_HERE]
   ```

3. **Set the environment variable** in your app-specific `.env` files:

   ### For Swap App (`apps/swap/.env.local`):
   ```bash
   POOL_MANAGER_CONTRACT_ID=[CONTRACT_ID_HERE]
   ```

   ### For Earn App (`apps/earn/.env.local`):
   ```bash
   POOL_MANAGER_CONTRACT_ID=[CONTRACT_ID_HERE]
   ```

   ### For Root App (`apps/_root/.env.local`):
   ```bash
   POOL_MANAGER_CONTRACT_ID=[CONTRACT_ID_HERE]
   ```

4. **Restart your development servers** for the environment variables to take effect.

## Verification:

To verify the setup is working:

1. Check that the quote endpoints work:
   ```bash
   curl "http://localhost:3000/api/trpc/getPools.quote_exact_tokens_for_tokens?input={\"id\":\"any\",\"amount_in\":100,\"token_in\":\"00\"}"
   ```

2. Check the browser console for any warnings about missing `POOL_MANAGER_CONTRACT_ID`.

## Troubleshooting:

- **Error: "POOL_MANAGER_CONTRACT_ID environment variable not set"**
  - Make sure you've added the environment variable to the correct `.env.local` file
  - Restart your development server
  
- **Error: "No swap path found"**
  - Ensure pools have been created and signed during seeding
  - Check that the tokens exist in the pool manager

- **Quote returns 0 amounts**
  - Verify the pool has sufficient liquidity
  - Check that the token UUIDs are correct 