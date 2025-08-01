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
- **Local Storage** for data persistence (no backend required)
- **i18next** for internationalization (English/Spanish)

### State Management
- Uses React Context API (TeamsContext) for global state management
- Teams data is persisted to browser localStorage automatically
- Local state management for UI components (modals, forms)

### Component Structure
- **App.tsx**: Main orchestrator handling team-level operations
- **TeamSection**: Manages individual team display and operations
- **FeatureCard/FeatureList**: Handle feature-level functionality
- **StepList**: Manages verification steps within features
- **Context providers** wrap the app for data access

### Data Flow
1. TeamsContext loads data from localStorage on app initialization
2. Components subscribe to context for state updates
3. User actions update context state
4. State changes are automatically persisted to localStorage
5. All data remains in the user's browser (no server required)

### Key Patterns
- Drag-and-drop functionality for reordering teams
- Modal-based UI for complex operations (duplicate, compare, etc.)
- Immediate UI updates with localStorage persistence
- Media files converted to base64 data URLs for local storage

## Data Structure (Local Storage)

The application stores data in browser localStorage using these structures:
- `qa_teams`: Array of team objects with nested features, steps, and media
- `qa_verifications`: Array of global verification records
- `qa-notebook-notes`: String containing user notes

## Environment Setup

No environment variables or backend setup required. The application runs entirely in the browser using localStorage for data persistence.

## Important Considerations

1. **Data Persistence**: All data is stored in browser localStorage. Data will persist between sessions but is device-specific and will be lost if localStorage is cleared.

2. **Media Storage**: Media files are converted to base64 data URLs and stored directly in localStorage. This has size limitations (~5-10MB total per domain).

3. **No Real-time Sync**: Since there's no backend, data changes are not synchronized between different browsers or devices.

4. **Internationalization**: All user-facing text should use i18next keys from `public/locales/[lang]/translation.json`.

5. **Type Safety**: The project uses TypeScript. All new code should maintain type safety using types defined in `src/types.ts`.

6. **Styling Convention**: Uses Tailwind CSS utility classes. Avoid custom CSS unless absolutely necessary.

7. **Component Patterns**: Follow existing patterns for modals, forms, and interactive elements for consistency.

8. **Storage Limits**: Be mindful of localStorage size limits when adding large media files. Consider compression or size limits for optimal performance.

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