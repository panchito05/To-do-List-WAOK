# To Do List WAOK

A comprehensive Quality Assurance testing management system for teams, built with React and TypeScript. This application allows teams to manage features, track verification steps, collaborate through comments, and maintain historical records of all testing activities. All data is stored locally in your browser for privacy and offline access.

## Features

### Team Management
- Create and manage multiple teams
- Drag-and-drop team reordering
- Duplicate teams with or without data
- Trash/restore functionality for teams
- Real-time team name editing

### Feature & Step Tracking
- Add unlimited features per team
- Create verification steps for each feature
- Mark steps as Working/Not Working/Pending
- Add detailed descriptions for features and steps
- Reorder steps within features

### Media Support
- Upload photos and videos for each verification step
- View media in a lightbox gallery
- Support for multiple media files per step

### Collaboration
- Comment system for each feature
- Track who made comments and when
- Real-time updates across team members

### Verification History
- Complete history of all verifications
- Global verification history across all teams
- Team comparison tool to analyze differences
- Date range filtering for historical data

### Import/Export
- Export teams to JSON format
- Import teams from other instances
- Automatic conflict resolution for duplicate team names

### Internationalization
- Full support for English and Spanish
- Easy language switching
- Translatable UI elements

## Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **State Management:** React Context API
- **Internationalization:** i18next
- **Icons:** Lucide React
- **Date Handling:** react-datepicker

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── features/       # Feature-specific components
│   │   ├── CommentSection.tsx
│   │   ├── FeatureCard.tsx
│   │   ├── FeatureList.tsx
│   │   ├── MediaUpload.tsx
│   │   ├── StepList.tsx
│   │   └── VerificationHistory.tsx
│   ├── ConfirmationModal.tsx
│   ├── DuplicateTeamModal.tsx
│   ├── GlobalVerificationHistory.tsx
│   ├── Header.tsx
│   ├── LanguageSwitcher.tsx
│   ├── MediaViewer.tsx
│   ├── NotebookModal.tsx
│   ├── TeamComparisonModal.tsx
│   └── TeamSection.tsx
├── context/            # React Context providers
│   └── TeamsContext.tsx
├── i18n/               # Internationalization setup
│   └── index.ts
├── lib/                # External library configurations
│   └── supabase.ts
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx           # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/panchito05/To-do-List-WAOK.git
cd To-do-List-WAOK
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
Apply the migrations in the `supabase/migrations` folder to set up your database schema.

5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint

## Database Schema

The application uses the following main tables:

- **teams** - Stores team information
- **features** - Stores features for each team
- **steps** - Stores verification steps for each feature
- **comments** - Stores comments for features
- **verifications** - Stores verification history
- **media** - Stores uploaded media files

## Usage

1. **Connect to Supabase**: Click the "Connect to Supabase" button in the header to establish database connection.

2. **Create Teams**: Click "Create New Team" to add a new team.

3. **Add Features**: Within each team, add features that need to be tested.

4. **Define Steps**: For each feature, create verification steps that need to be checked.

5. **Verify Steps**: Mark each step as Working, Not Working, or leave as Pending.

6. **Add Comments**: Use the comment section to collaborate with team members.

7. **Upload Media**: Attach photos or videos to document verification results.

8. **View History**: Access the verification history to track changes over time.

9. **Compare Teams**: Use the comparison tool to analyze differences between teams or time periods.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository.

---

[Edit in StackBlitz ⚡️](https://stackblitz.com/~/github.com/panchito05/To-do-List-WAOK)