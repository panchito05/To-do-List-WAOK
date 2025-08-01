# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm run dev      # Start development server on http://localhost:5173
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint for code quality checks
```

### Testing
Currently, there is no test suite configured. When implementing tests, consider using Vitest (already compatible with Vite setup) or Jest with React Testing Library.

## Architecture Overview

This is a React-based Quality Assurance management system with the following architecture:

### Core Technologies
- **React 18** with TypeScript for type safety
- **Vite** as the build tool for fast development
- **Tailwind CSS** for utility-first styling
- **Supabase** for backend (PostgreSQL database + real-time subscriptions)
- **i18next** for internationalization (English/Spanish)

### State Management
- Uses React Context API (TeamsContext) for global state management
- Teams data is synchronized with Supabase in real-time
- Local state management for UI components (modals, forms)

### Component Structure
- **App.tsx**: Main orchestrator handling team-level operations
- **TeamSection**: Manages individual team display and operations
- **FeatureCard/FeatureList**: Handle feature-level functionality
- **StepList**: Manages verification steps within features
- **Context providers** wrap the app for data access

### Data Flow
1. Supabase provides real-time data synchronization
2. TeamsContext fetches and manages team data
3. Components subscribe to context for updates
4. User actions trigger Supabase operations
5. Real-time subscriptions update all connected clients

### Key Patterns
- Drag-and-drop functionality for reordering teams
- Modal-based UI for complex operations (duplicate, compare, etc.)
- Optimistic UI updates with Supabase confirmation
- Media uploads stored in Supabase storage buckets

## Database Schema (Supabase)

The application expects these tables in Supabase:
- `teams`: id, name, order, created_at, updated_at
- `features`: id, team_id, number, name, description, created_at
- `steps`: id, feature_id, number, description, order, status, last_verified
- `comments`: id, feature_id, text, author, timestamp
- `verifications`: id, feature_id, timestamp, steps (JSONB)
- `media`: id, step_id, type, url, created_at
- `notes`: id, content, files, created_at, updated_at

## Environment Setup

Required environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Important Considerations

1. **Supabase Connection**: The app requires a valid Supabase connection. Users must click "Connect to Supabase" and provide credentials.

2. **Real-time Updates**: The app uses Supabase real-time subscriptions. Ensure RLS (Row Level Security) policies are properly configured.

3. **Media Storage**: Media files are stored in Supabase storage. Ensure storage buckets are created and accessible.

4. **Internationalization**: All user-facing text should use i18next keys from `public/locales/[lang]/translation.json`.

5. **Type Safety**: The project uses TypeScript. All new code should maintain type safety using types defined in `src/types.ts`.

6. **Styling Convention**: Uses Tailwind CSS utility classes. Avoid custom CSS unless absolutely necessary.

7. **Component Patterns**: Follow existing patterns for modals, forms, and interactive elements for consistency.

## MCP (Model Context Protocol) Servers - Bidirectional Synchronization

**CRITICAL**: This project requires specific MCP servers. Claude MUST perform bidirectional synchronization of MCPs when opening the project.

### MCP Synchronization Protocol

1. **Inventory Phase** - Check installed MCPs:
   ```bash
   # List all MCPs currently installed
   claude mcp list
   
   # Check project MCP requirements file
   cat .claude/mcp-requirements.md
   ```

2. **Comparison Phase** - Identify gaps:
   - MCPs installed but NOT documented → ADD to .claude/mcp-requirements.md
   - MCPs documented but NOT installed → INSTALL them
   - MCPs in BOTH → DO NOTHING (already synchronized)

3. **Documentation Phase** - Save undocumented MCPs:
   - If any MCP is found via `claude mcp list` that's not in .claude/mcp-requirements.md
   - Add its installation command to the documentation
   - Preserve all existing MCPs

4. **Installation Phase** - Install missing MCPs:
   - Use install-mcps.sh which verifies before installing
   - Script will skip already installed MCPs
   - Only install what's missing

5. **Verification Phase**:
   - Run `claude mcp list` to confirm all MCPs connected
   - Expected: 14 MCPs minimum (11 standard + 3 additional)
   - Report: "MCP synchronization complete: X MCPs ready"

### Required MCP Servers

This project uses 14 MCPs:

**Standard MCPs (11):**
1. **context7** - Library documentation
2. **filesystem** - File access (WSL + Windows)
3. **git** - Version control
4. **github** - GitHub repositories
5. **sequential-thinking** - Problem solving
6. **desktop-commander** - Desktop control
7. **netlify** - Web deployment
8. **playwright** - Browser automation
9. **firebase** - Backend services
10. **postgres** - PostgreSQL database
11. **mysql** - MySQL database

**Additional MCPs (3):**
12. **puppeteer** - Alternative browser control
13. **everything** - MCP testing features
14. **memory** - Persistent memory

### MCP Requirements File

The project maintains `.claude/mcp-requirements.md` which contains:
- Complete installation guide for all MCPs
- Database setup instructions (PostgreSQL & MySQL)
- All commands with `-s user` scope
- Token configuration guide
- Verification commands

### Synchronization Rules

- **PRESERVE ALL MCPs**: Never uninstall, only add missing ones
- **VERIFY FIRST**: Always check what exists before installing
- **AUTOMATIC**: This happens without user intervention
- **UNION PRINCIPLE**: Total MCPs = all installed + all documented

### Expected Outcome

After synchronization:
- All 14 project MCPs installed and connected
- Any additional MCPs preserved and documented
- Install script ready for new developers
- No manual MCP installation needed