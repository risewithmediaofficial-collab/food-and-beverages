# Project Rules for Juice ERP

## Code Hygiene & Cleanup Rule
- **Automatic Cleanup**: Whenever modifying, refactoring, or restructuring code, proactively delete any unused legacy files, orphaned directories, dead code branches, or superseded mock files.
- **Monorepo Architecture**: Maintain strict separation between `backend/` (Node Express API) and `frontend/` (React Vite app). Do not leave legacy code or duplicated files in the root folder.
