# Oasis Feature - Hidden Status

## Overview
The Oasis feature has been temporarily hidden from the frontend using a feature flag system. This allows for easy restoration when the feature is ready to be launched.

## What Was Hidden
- **Swap App Navigation**: The "Oasis" navigation item in the header that linked to `/pool/oasis`
- **Earn App Navigation**: The "Oasis" navigation item in the earn app header that linked to `/oasis`
- **Explore Menu**: The "Oasis" option in the explore menu (UI package)
- **Page Access**: Direct access to `/oasis` page is blocked with a user-friendly message
- **Page Titles**: Oasis-related page titles are hidden when the feature is disabled
- **Feature Flag**: The feature is controlled by `OASIS_ENABLED: false` in config files

## How to Restore the Oasis Feature

### Option 1: Quick Toggle (Recommended)
1. Open the following files:
   - `apps/swap/config/features.ts`
   - `apps/earn/config/features.ts`
   - `packages/ui/config/features.ts`
2. Change `OASIS_ENABLED: false` to `OASIS_ENABLED: true` in all files
3. Save the files
4. The Oasis feature will automatically become visible again

### Option 2: Remove Feature Flag System
If you want to permanently restore the feature without the feature flag system:

1. Open `apps/swap/components/Header.tsx`
2. Remove the conditional rendering:
   ```tsx
   // Remove this line:
   import { isFeatureEnabled } from 'config/features'
   
   // Replace this:
   {isFeatureEnabled('OASIS_ENABLED') && (
     <App.NavItem
       className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
       href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool/oasis`}
       label="Oasis"
     />
   )}
   
   // With this:
   <App.NavItem
     className="text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-100 to-yellow-500"
     href={`${process.env.NEXT_PUBLIC_SITE_URL}/pool/oasis`}
     label="Oasis"
   />
   ```

3. Optionally delete `apps/swap/config/features.ts` if no other features use it

## Current Status
- ✅ Oasis feature is completely hidden from users across all apps
- ✅ Navigation links hidden in swap app, earn app, and explore menu
- ✅ Direct page access blocked with user-friendly message
- ✅ Page titles updated to hide Oasis references
- ✅ Feature flag system is in place for easy restoration
- ✅ No code was deleted, only conditionally hidden
- ✅ Restoration requires changing three boolean values

## Files Modified
- `apps/swap/components/Header.tsx` - Hidden navigation link
- `apps/earn/components/Header.tsx` - Hidden navigation link
- `packages/ui/app/Header.tsx` - Hidden explore menu option
- `apps/earn/pages/oasis.tsx` - Added page blocker
- `apps/earn/pages/_app.tsx` - Updated page title logic
- `apps/swap/config/features.ts` - Feature flag configuration
- `apps/earn/config/features.ts` - Feature flag configuration
- `packages/ui/config/features.ts` - Feature flag configuration

## Notes
- The Oasis feature itself (backend, contracts) remains fully functional
- All frontend access points have been hidden or blocked
- Users see helpful navigation options if they try to access the page directly
- The feature flag system can be reused for other features in the future
- No database or API changes were made
