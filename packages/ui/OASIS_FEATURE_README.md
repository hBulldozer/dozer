# Oasis Feature - Hidden Status (UI Package)

## Overview
The Oasis feature has been temporarily hidden from the UI package using a feature flag system. This allows for easy restoration when the feature is ready to be launched.

## What Was Hidden
- **Explore Menu Option**: The "Oasis" option in the explore menu that linked to `/pool/oasis`
- **Feature Flag**: The feature is controlled by `OASIS_ENABLED: false` in config files

## How to Restore the Oasis Feature

### Option 1: Quick Toggle (Recommended)
1. Open `packages/ui/config/features.ts`
2. Change `OASIS_ENABLED: false` to `OASIS_ENABLED: true`
3. Save the file
4. The Oasis explore menu option will automatically reappear

### Option 2: Remove Feature Flag System
If you want to permanently restore the feature without the feature flag system:
1. Remove the feature flag import and conditional checks from the Header component
2. Restore the original Oasis menu option

## Current Status
- ✅ Oasis feature is hidden from users in the explore menu
- ✅ Feature flag system is in place for easy restoration
- ✅ No code was deleted, only conditionally hidden
- ✅ Restoration requires changing one boolean value

## Notes
- The Oasis feature itself (backend, contracts, earn app) remains fully functional
- Only the frontend navigation has been hidden
- The feature flag system can be reused for other features in the future
- No database or API changes were made
- This change affects all apps that use the UI package
