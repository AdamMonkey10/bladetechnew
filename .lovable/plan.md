

## Plan: Delete bladetech-legacy Folder

Remove the entire `bladetech-legacy/` directory from the project. This folder contains the old Firebase-based React app that has been fully migrated to Lovable Cloud.

### What gets deleted

All files under `bladetech-legacy/`, including:
- Firebase config, hosting rules, Firestore rules
- Legacy React components (MUI-based shift forms, calibration, label printing, etc.)
- Firebase auth helpers (`AuthProvider.js`, `authService.js`, `signin.js`, `signup.js`, `signout.js`)
- GitHub Actions workflows for Firebase Hosting
- Generated Firebase Data Connect SDK
- Legacy `package.json` and lock files

### What stays untouched

- All `src/` code (the active Lovable app)
- `supabase/` migrations and edge functions
- The Firestore warehouse adapter (`src/features/warehouse/adapters/firestoreWarehouseRepo.ts`) — left in place since you only asked to remove the legacy folder

### Steps

1. Delete the `bladetech-legacy/` directory and all its contents

No database or config changes needed.

