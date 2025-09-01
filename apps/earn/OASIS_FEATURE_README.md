# Oasis Feature - Hidden Status (Earn App)

## Overview
The Oasis feature has been temporarily hidden from the earn app using a feature flag system. This allows for easy restoration when the feature is ready to be launched.

## What Was Hidden
- **Navigation Link**: The "Oasis" navigation item in the header that linked to `/oasis`
- **Page Access**: Direct access to `/oasis` page is blocked with a user-friendly message
- **Page Title**: The "Dozer - Oasis 🏝️" title is hidden when the feature is disabled
- **Feature Flag**: The feature is controlled by `OASIS_ENABLED: false` in config files

## How to Restore the Oasis Feature

### Option 1: Quick Toggle (Recommended)
1. Open `apps/earn/config/features.ts`
2. Change `OASIS_ENABLED: false` to `OASIS_ENABLED: true`
3. Save the file
4. The Oasis feature will automatically reappear

### Option 2: Remove Feature Flag System
If you want to permanently restore the feature without the feature flag system:
1. Remove the feature flag import and conditional checks from the relevant files
2. Restore the original code structure

## Current Status
- ✅ Oasis feature is hidden from users in the earn app navigation
- ✅ Direct page access is blocked with a user-friendly message
- ✅ Page titles are updated to hide Oasis references
- ✅ Feature flag system is in place for easy restoration
- ✅ No code was deleted, only conditionally hidden
- ✅ Restoration requires changing one boolean value

## Notes
- The Oasis feature itself (backend, contracts) remains fully functional
- Users who try to access `/oasis` directly see a maintenance message with navigation options
- The page blocker provides helpful links to other parts of the app
- The feature flag system can be reused for other features in the future
- No database or API changes were made
