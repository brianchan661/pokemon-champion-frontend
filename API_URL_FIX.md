# API URL Configuration Fix

## Problem
The frontend was calling `/pokemon` instead of `/api/pokemon` because the `NEXT_PUBLIC_API_URL` environment variable was set to the backend URL without the `/api` suffix, but the code wasn't consistently appending it.

## Solution
Created a centralized API configuration module that automatically appends `/api` to the backend URL.

### Changes Made

1. **Created `src/config/api.ts`**
   - `getApiBaseUrl()`: Returns backend URL with `/api` suffix for API calls
   - `getBackendBaseUrl()`: Returns backend URL without `/api` for OAuth redirects

2. **Updated all service files** to use `getApiBaseUrl()`:
   - `src/services/authService.ts`
   - `src/services/abilitiesService.ts`
   - `src/services/itemsService.ts`
   - `src/services/movesService.ts`
   - `src/services/naturesService.ts`
   - `src/services/pokemonBuilderService.ts`
   - `src/services/teamService.ts`
   - `src/services/teamService.improved.ts`
   - `src/services/teraTypesService.ts`
   - `src/utils/api.ts`

3. **Updated all page files** to use `getApiBaseUrl()`:
   - `src/pages/index.tsx`
   - `src/pages/pokemon/index.tsx`
   - `src/pages/pokemon/[id].tsx`
   - `src/pages/teams/index.tsx`
   - `src/pages/teams/[id].tsx`
   - `src/pages/teams/builder.tsx`
   - `src/pages/teams/create.tsx`
   - `src/pages/profile.tsx`
   - `src/pages/news/index.tsx`
   - `src/pages/news/[slug].tsx`
   - `src/pages/data/abilities.tsx`
   - `src/pages/data/abilities/[id].tsx`
   - `src/pages/data/items/[id].tsx`
   - `src/pages/data/moves.tsx`
   - `src/pages/data/moves/[id].tsx`
   - `src/pages/admin.tsx`
   - `src/pages/verify-email/[token].tsx`

4. **Updated all component files**:
   - `src/components/Auth/LoginForm.tsx` (uses `getBackendBaseUrl()` for OAuth)
   - `src/components/Auth/RegisterForm.tsx` (uses `getBackendBaseUrl()` for OAuth)
   - `src/components/Auth/CheckEmail.tsx`
   - `src/components/Teams/MyTeamCard.tsx`
   - `src/components/Editor/TipTapEditor.tsx`
   - `src/components/Admin/NewsManagement.tsx`
   - `src/components/Admin/NewsArticleForm.tsx`
   - `src/components/Admin/UserManagement.tsx`
   - `src/components/Admin/UserDetailModal.tsx`
   - `src/components/Admin/PremiumManagement.tsx`

5. **Updated `.env.local.example`**
   - Added documentation that `NEXT_PUBLIC_API_URL` should NOT include `/api`

## Environment Variable Format

### Before (Incorrect)
```bash
NEXT_PUBLIC_API_URL=https://backend.example.com/api  # ❌ Wrong
```

### After (Correct)
```bash
NEXT_PUBLIC_API_URL=https://backend.example.com  # ✅ Correct
```

The `/api` suffix is now automatically appended by the `getApiBaseUrl()` function.

## Deployment Impact

When rebuilding the frontend Docker image, use:
```powershell
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://pokemon-champion-backend-mtphgnxlta-uc.a.run.app \
  -t frontend:latest \
  .
```

Note: Do NOT include `/api` in the `NEXT_PUBLIC_API_URL` build argument.

## Testing

After deploying, verify the API calls are correct:
1. Open browser DevTools Network tab
2. Navigate to `/pokemon` page
3. Verify API calls go to: `https://backend-url/api/pokemon` (with `/api`)
4. Verify OAuth redirects go to: `https://backend-url/auth/google` (without `/api`)
