# Pokemon Champion Frontend

Next.js frontend application for the Pokemon Champion website.

## Features

- Next.js 13 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Internationalization (i18n) support
- React Query for data fetching
- Responsive design
- Progressive Web App (PWA) ready

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Supported Languages

- English (en) - Default
- Japanese (ja)
- Chinese Simplified (zh-CN) - Coming soon
- Chinese Traditional (zh-TW) - Coming soon

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Layout components (Header, Footer, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages
├── styles/             # Global styles and Tailwind config
└── utils/              # Utility functions

public/
└── locales/            # Translation files
    ├── en/
    └── ja/
```

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Styling

This project uses Tailwind CSS with custom Pokemon-themed colors and components. See `tailwind.config.js` for the complete configuration.

## Internationalization

The app uses `next-i18next` for internationalization. Translation files are located in `public/locales/[locale]/[namespace].json`.

To add a new language:
1. Add the locale to `next-i18next.config.js`
2. Create translation files in `public/locales/[locale]/`
3. Update the language selector component

## API Integration

The frontend communicates with the backend API using React Query for efficient data fetching and caching. API calls are centralized in custom hooks located in the `src/hooks/` directory.