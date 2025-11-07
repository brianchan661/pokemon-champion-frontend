# Teams Pages

This directory contains all team-related pages for the Pokemon Champion frontend.

## Pages

### `/teams` - Public Teams List
- **File**: `index.tsx`
- **Access**: Public (no authentication required)
- **Features**:
  - Browse all public teams
  - Sort by newest, oldest, or most liked
  - View team cards with Pokemon preview
  - Links to "My Teams" and "Create Team"

### `/teams/my` - My Teams
- **File**: `my.tsx`
- **Access**: Authenticated users only
- **Features**:
  - View all user's teams (both public and private)
  - Team count display (X of 10 teams)
  - Team limit warning when at maximum
  - Quick actions per team:
    - View Details
    - Edit Team
    - Toggle Public/Private visibility
    - Delete Team (with confirmation)
  - Empty state with call-to-action
  - Auto-redirect to login if not authenticated

### `/teams/create` - Create Team (TODO)
- **Status**: Not yet implemented
- **Planned Features**:
  - Team builder interface
  - Pokemon selection (1-6 Pokemon)
  - Move, ability, item selection
  - EV/IV configuration
  - Public/private toggle

### `/teams/[id]` - Team Detail (TODO)
- **Status**: Not yet implemented
- **Planned Features**:
  - Full team details
  - Pokemon stats and movesets
  - Like/unlike functionality
  - Comment system
  - Share functionality

### `/teams/[id]/edit` - Edit Team (TODO)
- **Status**: Not yet implemented
- **Planned Features**:
  - Same as create, but pre-filled with existing data
  - Update team metadata
  - Modify Pokemon lineup

## Services

### `teamService.ts`
Handles all team-related API calls:
- `getMyTeams()` - Fetch authenticated user's teams
- `getTeamById(id)` - Fetch single team details
- `deleteTeam(id)` - Delete a team
- `toggleTeamVisibility(id, isPublic)` - Change team visibility

## Translation Keys

All team-related translations are in `public/locales/{lang}/common.json` under the `teams` namespace:

```json
{
  "teams": {
    "myTeams": "My Teams",
    "createTeam": "Create Team",
    "browseTeams": "Browse Teams",
    "teamCount": "{{count}} of {{limit}} teams",
    "limitReached": "Team limit reached",
    "public": "Public",
    "private": "Private",
    "edit": "Edit",
    "delete": "Delete",
    "confirmDelete": "Confirm Delete",
    "makePublic": "Make Public",
    "makePrivate": "Make Private",
    // ... more keys
  }
}
```

## Backend API Endpoints Used

- `GET /api/teams/my` - Get user's teams
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

## Authentication

The "My Teams" page uses the `useAuth` hook from `AuthContext` to:
1. Check if user is authenticated
2. Redirect to login if not authenticated
3. Pass auth token in API requests via `teamService`

## State Management

Uses React Query for:
- Fetching teams data
- Caching responses
- Optimistic updates
- Automatic refetching after mutations

## Future Enhancements

1. **Team Builder UI** - Visual Pokemon selection interface
2. **Team Detail Page** - Full team view with comments and likes
3. **Team Edit Page** - Modify existing teams
4. **Team Search/Filter** - Find teams by Pokemon, strategy, etc.
5. **Team Import/Export** - Share teams via JSON/text format
6. **Team Analytics** - View team statistics and popularity
