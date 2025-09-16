# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based wedding RSVP application with Supabase backend integration. The app is built with Create React App, uses React Router for navigation, Tailwind CSS for styling (with a sunflower theme), and integrates with Google Drive API for media storage.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (use with caution)
npm run eject
```

## Environment Configuration

The application requires environment variables in `.env` or `.env.local`:
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REACT_APP_GOOGLE_API_KEY` - Google API key for Drive integration
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `REACT_APP_DRIVE_*_FOLDER_ID` - Google Drive folder IDs for media storage
- `REACT_APP_WEDDING_DATE_TIME` - Wedding date in ISO format
- `REACT_APP_VENUE_NAME` - Venue name
- `REACT_APP_VENUE_ADDRESS` - Venue address

## Architecture

### Core Structure
- **Authentication**: Supabase Auth with session management in `App.jsx`
- **Routing**: React Router v6 with protected routes and role-based access
- **State Management**: React hooks with context providers for auth
- **Styling**: Tailwind CSS with custom sunflower theme configuration

### Key Directories
- `src/pages/` - Page components for each route
  - Authentication pages (Login, Signup, ResetPassword)
  - RSVP functionality (RSVPPage, ViewRSVPPage) 
  - Admin dashboard with guest management
  - Media pages (WeddingAlbum, UploadMedia)
  - Guest interaction (MessageWall, LeaveMessage)
  - Venue information page
- `src/components/` - Reusable UI components
  - AuthLayout - Authentication page wrapper
  - NavigationBar - Main app navigation
  - GoogleDrivePicker - Drive media picker integration
  - ProtectedRoute/RoleRoute - Route guards
- `src/utils/` - Utility functions for Google Drive, filenames, URLs
- `src/hooks/` - Custom React hooks (e.g., useCountdown)
- `src/context/` - React context providers
- `src/config/` - Configuration files (media config)

### Key Integration Points
- **Supabase Client**: Initialized in `src/supabaseClient.js` with auth persistence
- **Google Drive**: Media upload/retrieval through picker API in utils
- **PDF Generation**: jsPDF for RSVP confirmations
- **CSV Export**: PapaParse for guest list exports
- **Confetti**: canvas-confetti for celebratory animations

### Database Schema (Supabase)
The app expects these Supabase tables (inferred from usage):
- Users/profiles table for authentication
- RSVP responses storage
- Messages/guestbook entries
- Media references

## Build Configuration
- Uses Create React App default webpack configuration
- PostCSS for Tailwind CSS processing
- Browserslist targets modern browsers
- ESLint with React hooks plugin for development