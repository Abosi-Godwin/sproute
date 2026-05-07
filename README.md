# sproute

## Stack
- **Framework:** Vite + React + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase
- **Icons:** Lucide React
- **Data fetching:** TanStack Query v5
- **Animations:** Framer Motion
- **Routing:** React Router v7
- **State:** Zustand

## Getting started

```bash
npm run dev
# → http://localhost:3000
```

## Folder structure

```
src/
├── api/
│   └── client.ts         ← configured fetch instance (get, post, put, patch, delete)
├── assets/
├── components/
│   ├── ui/
│   │   ├── Button.tsx       ← variants: primary, secondary, outline, ghost, danger
│   │   ├── Input.tsx        ← with label, error, hint support
│   │   └── Card.tsx         ← Card, CardHeader, CardBody, CardFooter
│   └── layout/
│       └── Navbar.tsx       ← responsive with mobile menu toggle
├── constants/
│   └── index.ts          ← APP_NAME, ROUTES, API_URL
├── types/
│   └── index.ts            ← ApiResponse<T>, PaginatedResponse<T>
├── hooks/
│   ├── useDebounce.ts
│   └── useLocalStorage.ts
├── lib/                    ← supabase.ts, store.ts
├── pages/
└── utils/
    └── cn.ts             ← clsx + tailwind-merge helper
```

## Scaffolded with

```bash
npx @alhaji/react-app sproute
```
