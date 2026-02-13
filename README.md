# S3 Storage Manager

A web-based S3-compatible storage management tool supporting AWS S3, MinIO, and other S3-compatible services. Built with SolidJS for reactive performance and modern UI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.8.17-blue)](https://www.solidjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)](https://www.typescriptlang.org/)

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **UI Framework** | SolidJS | 1.8.17 | Reactive UI library (NOT React) |
| **Build Tool** | Vite | 5.2.11 | Fast build tool and dev server |
| **Language** | TypeScript | 5.4.5 | Type-safe JavaScript (strict mode) |
| **Styling** | TailwindCSS | 3.4.3 | Utility-first CSS framework |
| **Routing** | @solidjs/router | 0.15.3 | SolidJS routing solution |
| **S3 SDK** | @aws-sdk/client-s3 | 3.705.0 | AWS S3 client library |
| **S3 Presigning** | @aws-sdk/s3-request-presigner | 3.705.0 | Generate presigned URLs |
| **Icons** | lucide-solid | 0.468.0 | Icon library (SolidJS version) |
| **Utilities** | clsx | 2.1.1 | Conditional class names |
| **Utilities** | tailwind-merge | 2.3.0 | Merge Tailwind classes |
| **PostCSS** | PostCSS | 8.4.38 | CSS processing |
| **PostCSS** | Autoprefixer | 10.4.19 | Auto-add vendor prefixes |
| **Vite Plugin** | vite-plugin-solid | 2.10.2 | SolidJS integration for Vite |

---

## Architecture

### Layer Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Atomic design components (Button, Card, Input)
│   ├── Layout/         # Layout shell (Layout, Sidebar)
│   └── Connection/     # Feature-specific components
├── pages/              # Route-level page components
│   ├── Home.tsx        # Dashboard with connection list
│   ├── AddConnection.tsx # Add new S3 connection
│   ├── Buckets.tsx     # Bucket listing per connection
│   └── ObjectBrowser.tsx # File/folder browser within bucket
├── services/           # S3 API abstraction layer
│   ├── s3.ts           # S3 client factory + bucket operations
│   └── s3_objects.ts   # Object CRUD + presigned URL generation
├── store/              # State management
│   └── connectionStore.ts # Connection CRUD with localStorage persistence
├── App.tsx             # Root component (minimal wrapper)
├── index.tsx           # Entry point with router setup
├── index.css           # Global styles + design tokens + Tailwind layers
└── routes.ts           # Route definitions (lazy-loaded)
```

### Design Patterns

| Pattern | Implementation | Location |
|---------|---------------|----------|
| **Atomic Design** | UI components split into atoms (Button, Input, Card) | [`src/components/ui/`](src/components/ui/) |
| **Container/Presenter** | Pages are containers, components are presenters | Pages fetch data, components render |
| **Service Layer** | S3 operations abstracted from UI | [`src/services/s3.ts`](src/services/s3.ts), [`src/services/s3_objects.ts`](src/services/s3_objects.ts) |
| **Store Pattern** | SolidJS `createStore` with localStorage persistence | [`src/store/connectionStore.ts`](src/store/connectionStore.ts) |
| **Lazy Loading** | All page components loaded on-demand | [`src/routes.ts`](src/routes.ts) |
| **Client Caching** | S3Client instances cached per connection ID | [`src/services/s3.ts`](src/services/s3.ts) |

### Data Flow

```
User Action → Page Component → Service Layer → S3 API
                  ↓                   ↓
            Store (State)      S3Client Cache
                  ↓
          localStorage (Persistence)
```

---

## Design System

### Overview

This project follows a custom design system defined in [`design-system/s3-manager/MASTER.md`](design-system/s3-manager/MASTER.md).

**Style Philosophy:** Flat Design, minimal, swiss, clean aesthetics

### Color Palette

| Color Name | Hex Code | CSS Variable | Usage |
|-----------|----------|--------------|-------|
| **Black** | `#171717` | `--color-black` | Primary text, borders, backgrounds |
| **Gray Dark** | `#404040` | `--color-gray-dark` | Secondary text |
| **Gray** | `#737373` | `--color-gray` | Muted text |
| **Gray Light** | `#A3A3A3` | `--color-gray-light` | Disabled states |
| **Gray Lighter** | `#D4D4D4` | `--color-gray-lighter` | Borders |
| **Gray Lightest** | `#F5F5F5` | `--color-gray-lightest` | Backgrounds |
| **White** | `#FFFFFF` | `--color-white` | Backgrounds |
| **Gold** | `#D4AF37` | `--color-gold` | Primary accent, CTAs |
| **Gold Hover** | `#C19B2E` | `--color-gold-hover` | Hover states |
| **Success** | `#16A34A` | `--color-success` | Success states |
| **Error** | `#DC2626` | `--color-error` | Error states |
| **Warning** | `#EA580C` | `--color-warning` | Warning states |

### Typography

- **Font Family:** Inter (only)
- **Font Sizes:** 12px, 14px, 16px, 18px, 24px, 32px, 48px
- **Line Heights:** 1.2 (headings), 1.5 (body), 1.75 (loose)
- **Font Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing Scale

| Token | Size | CSS Variable |
|-------|------|--------------|
| `xs` | 4px | `--spacing-xs` |
| `sm` | 8px | `--spacing-sm` |
| `md` | 16px | `--spacing-md` |
| `lg` | 24px | `--spacing-lg` |
| `xl` | 32px | `--spacing-xl` |
| `2xl` | 48px | `--spacing-2xl` |
| `3xl` | 64px | `--spacing-3xl` |

### Shadow Levels

| Level | CSS Variable | Usage |
|-------|--------------|-------|
| `sm` | `--shadow-sm` | Small elevations |
| `md` | `--shadow-md` | Cards, dropdowns |
| `lg` | `--shadow-lg` | Modals |
| `xl` | `--shadow-xl` | Maximum elevation |

### Component Specifications

| Component | Variants | States | Border Radius |
|-----------|----------|--------|---------------|
| **Button** | primary, secondary, ghost, outline | default, hover, disabled, focus | 6px |
| **Card** | default | default, hover | 8px |
| **Input** | default | default, focus, disabled, error | 6px |

### Anti-Patterns (Do NOT Use)

❌ Excessive animation (keep 150-300ms)  
❌ Dark mode by default (no dark mode implemented)  
❌ Emojis as icons (use lucide-solid only)  
❌ Layout-shifting hovers (use scale/opacity only)  
❌ Low contrast text (minimum contrast ratio: 4.5:1)  
❌ Instant state changes (always transition)  
❌ Invisible focus states (always show focus)  

---

## Getting Started

### Prerequisites

- **Node.js:** v18.x or higher
- **npm:** v9.x or higher
- **S3-compatible service:** AWS S3, MinIO, or other

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd s3-storage-manager

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
# or
npm start
```

Server will start at [`http://localhost:3000`](http://localhost:3000)

### Building for Production

```bash
npm run build
```

Build output will be in `dist/` directory.

### Preview Production Build

```bash
npm run serve
```

---

## Automated Release Pipeline

This project uses an automated CI/CD pipeline for versioning, building, and publishing releases.

### Versioning

- **Format:** `0.1.{run_number}` (e.g., `0.1.1`, `0.1.2`, `0.1.3`, ...)
- **Increment:** Automatically increments with each GitHub Actions run

### Release Triggers

Releases are created automatically on:
- Push to `main` branch
- Manual workflow dispatch (via GitHub Actions UI)

### Docker Images

- **Registry:** GitHub Container Registry (GHCR)
- **Image:** `ghcr.io/<owner>/<repo>`
- **Tags:**
  - `<version>` — Exact version (e.g., `0.1.5`)
  - `0.1` — Major.minor version
  - `latest` — Latest stable release

### GitHub Releases

- **Tag format:** `v<version>` (e.g., `v0.1.5`)
- **Includes:** Release notes with Docker pull/run commands

### Usage

Pull and run the latest image:
```bash
docker pull ghcr.io/<owner>/<repo>:latest
docker run -d -p 8080:80 ghcr.io/<owner>/<repo>:latest
```

Pull a specific version:
```bash
docker pull ghcr.io/<owner>/<repo>:0.1.5
```

---

## Project Structure

```
s3-storage-manager/
├── index.html                          # HTML entry point
├── package.json                        # Dependencies and scripts
├── vite.config.ts                      # Vite configuration (port 3000)
├── tailwind.config.js                  # TailwindCSS config (extended colors, Inter font)
├── postcss.config.js                   # PostCSS config (Tailwind + Autoprefixer)
├── tsconfig.json                       # TypeScript config (strict, ESNext, solid-js)
│
├── design-system/                      # Design system documentation
│   └── s3-manager/
│       └── MASTER.md                   # Complete design system specification
│
└── src/
    ├── index.tsx                       # App entry point with router setup
    ├── App.tsx                         # Root component (minimal wrapper)
    ├── index.css                       # Global styles + CSS variables + Tailwind layers
    ├── routes.ts                       # Route definitions (lazy-loaded pages)
    │
    ├── components/                     # Reusable UI components
    │   ├── ui/                         # Atomic design components
    │   │   ├── Button.tsx              # Button component + cn() utility
    │   │   ├── Card.tsx                # Card component
    │   │   └── Input.tsx               # Input component
    │   ├── Layout/                     # Layout components
    │   │   ├── Layout.tsx              # Main layout shell
    │   │   └── Sidebar.tsx             # Sidebar navigation
    │   └── Connection/                 # Feature-specific components
    │       └── AddConnectionForm.tsx   # Add connection form
    │
    ├── pages/                          # Route-level page components
    │   ├── Home.tsx                    # Dashboard with connection list
    │   ├── AddConnection.tsx           # Add new S3 connection
    │   ├── Buckets.tsx                 # Bucket listing per connection
    │   └── ObjectBrowser.tsx           # File/folder browser within bucket
    │
    ├── services/                       # S3 API abstraction layer
    │   ├── s3.ts                       # S3 client factory + bucket operations
    │   └── s3_objects.ts               # Object CRUD + presigned URL generation
    │
    └── store/                          # State management
        └── connectionStore.ts          # Connection CRUD with localStorage persistence
```

---

## Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | [`Home`](src/pages/Home.tsx) | Dashboard displaying all S3 connections |
| `/connections/add` | [`AddConnection`](src/pages/AddConnection.tsx) | Form to add new S3 connection |
| `/connections/:id/buckets` | [`Buckets`](src/pages/Buckets.tsx) | List all buckets for a connection |
| `/connections/:id/buckets/:bucketName/*` | [`ObjectBrowser`](src/pages/ObjectBrowser.tsx) | Browse objects/folders within a bucket |

**Routing Implementation:**
- Uses `@solidjs/router` with `<Router>` and `<Routes>`
- All page components are lazy-loaded via `lazy()` in [`src/routes.ts`](src/routes.ts)
- Dynamic segments: `:id` (connection ID), `:bucketName` (bucket name), `*` (object path)

---

## State Management

### Overview

State management uses **SolidJS stores** (NOT React hooks, NOT Redux, NOT Zustand).

### Connection Store

**File:** [`src/store/connectionStore.ts`](src/store/connectionStore.ts)

**Interface:**
```typescript
interface S3Connection {
  id: string;
  name: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}
```

**API:**
```typescript
// State
const [connections, setConnections] = createStore<S3Connection[]>([]);

// Actions
addConnection(connection: Omit<S3Connection, 'id'>): void
deleteConnection(id: string): void
getConnection(id: string): S3Connection | undefined
```

### Persistence

- **Storage:** Browser `localStorage`
- **Key:** `s3-manager-connections`
- **Format:** JSON array of `S3Connection` objects
- **Sync:** Automatic on every state mutation

### Data Fetching

Uses **SolidJS `createResource`** for reactive async data:

```typescript
const [data, { refetch }] = createResource(() => fetchData());
```

**Pattern:**
- Automatic loading/error states
- Reactive re-fetching on dependency changes
- No manual loading state management

---

## Services

### S3 Service Layer

**Purpose:** Abstract S3 API operations from UI components

### [`src/services/s3.ts`](src/services/s3.ts)

**S3 Client Management:**
```typescript
getS3Client(connection: S3Connection): S3Client
```
- Caches S3Client instances per connection ID
- Configures `forcePathStyle: true` for S3-compatible endpoints

**Bucket Operations:**
```typescript
listBuckets(connection: S3Connection): Promise<Bucket[]>
createBucket(connection: S3Connection, bucketName: string): Promise<void>
deleteBucket(connection: S3Connection, bucketName: string): Promise<void>
```

### [`src/services/s3_objects.ts`](src/services/s3_objects.ts)

**Object Operations:**
```typescript
listObjects(connection: S3Connection, bucketName: string, prefix?: string): Promise<ObjectInfo[]>
uploadObject(connection: S3Connection, bucketName: string, key: string, file: File): Promise<void>
deleteObject(connection: S3Connection, bucketName: string, key: string): Promise<void>
getPresignedUrl(connection: S3Connection, bucketName: string, key: string): Promise<string>
```

**Conventions:**
- All functions take `connection: S3Connection` as first parameter
- Error handling via try/catch with user-friendly messages
- Automatic client caching for performance

---

## UI Components

### Button Component

**File:** [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx)

**API:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: JSX.Element;
  // ... standard button props
}
```

**Variants:**
- `primary` — Gold background, black text (default)
- `secondary` — Gray background, black text
- `ghost` — Transparent, hover background
- `outline` — Border only, transparent background

**Sizes:**
- `sm` — Small (32px height)
- `md` — Medium (40px height, default)
- `lg` — Large (48px height)

**Utility Export:**
```typescript
export function cn(...inputs: ClassValue[]): string
```
Use `cn()` for dynamic class composition throughout the app.

### Card Component

**File:** [`src/components/ui/Card.tsx`](src/components/ui/Card.tsx)

**API:**
```typescript
interface CardProps {
  children: JSX.Element;
  class?: string;
  onClick?: () => void;
  // ... standard div props
}
```

**Features:**
- 8px border radius
- Shadow elevation (md)
- Hover state with scale transform
- Optional click handler

### Input Component

**File:** [`src/components/ui/Input.tsx`](src/components/ui/Input.tsx)

**API:**
```typescript
interface InputProps {
  label?: string;
  error?: string;
  // ... standard input props
}
```

**Features:**
- Optional label (top-aligned)
- Error state with red border + message
- Focus state with gold ring
- Disabled state with gray background

---

## Code Conventions

### 1. Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Components** | PascalCase | `AddConnectionForm`, `ObjectBrowser` |
| **Interfaces/Types** | PascalCase | `S3Connection`, `ButtonProps` |
| **Functions** | camelCase | `handleSubmit`, `listBuckets` |
| **Variables** | camelCase | `connectionStore`, `bucketName` |
| **Signals** | camelCase | `[count, setCount]` |
| **File names (services)** | snake_case | `s3_objects.ts` (exception) |
| **File names (components)** | PascalCase | `AddConnection.tsx` |

### 2. File Organization

```typescript
// One component per file
// Pages: default export
export default function Home() { /* ... */ }

// Reusable components: named export
export function Button(props: ButtonProps) { /* ... */ }

// Feature components: named export
export function AddConnectionForm() { /* ... */ }
```

### 3. Import Order

```typescript
// 1. SolidJS imports
import { Component, createSignal, Show, For } from 'solid-js';

// 2. Router imports
import { useNavigate, useParams } from '@solidjs/router';

// 3. Store/service imports
import { connectionStore } from '../store/connectionStore';
import { listBuckets } from '../services/s3';

// 4. Component imports
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// 5. Icon imports
import { Plus, Trash } from 'lucide-solid';
```

### 4. TypeScript Patterns

```typescript
// ✅ Use interfaces
interface S3Connection {
  id: string;
  name: string;
}

// ✅ Use Omit for partial types
type NewConnection = Omit<S3Connection, 'id'>;

// ✅ Strict mode enabled (tsconfig.json)
// Always provide types for function parameters
function addConnection(connection: Omit<S3Connection, 'id'>): void {
  // ...
}
```

### 5. SolidJS Component Patterns

```typescript
import { Component, splitProps, createSignal, Show, For } from 'solid-js';

// ✅ Use Component<Props> type
export const Button: Component<ButtonProps> = (props) => {
  // ✅ Use splitProps for forwarding props
  const [local, others] = splitProps(props, ['variant', 'size']);
  
  // ✅ Use createSignal for local state
  const [isLoading, setIsLoading] = createSignal(false);
  
  return <button {...others}>Click</button>;
};

// ✅ Use Show for conditional rendering
<Show when={data()} fallback={<p>Loading...</p>}>
  {(d) => <div>{d().name}</div>}
</Show>

// ✅ Use For for list rendering
<For each={items()}>
  {(item) => <div>{item.name}</div>}
</For>

// ✅ Use createResource for async data
const [buckets, { refetch }] = createResource(() => listBuckets(connection));
```

### 6. CSS Class Composition

```typescript
import { cn } from './components/ui/Button';

// ✅ Use cn() utility for dynamic classes
const buttonClass = cn(
  'base-class',
  variant === 'primary' && 'btn-primary',
  isDisabled && 'opacity-50'
);
```

---

## Design System Compliance Checklist

Before delivery, verify:

### Visual Design
- [ ] All colors use CSS variables from `:root` in [`src/index.css`](src/index.css)
- [ ] Font family is Inter only
- [ ] No emojis used as icons (lucide-solid only)
- [ ] Minimum contrast ratio 4.5:1 for text
- [ ] All shadows use design system tokens (sm, md, lg, xl)

### Spacing & Layout
- [ ] All spacing uses design system tokens (xs through 3xl)
- [ ] Border radius: 6px (buttons/inputs), 8px (cards)
- [ ] No layout shifts on hover (scale/opacity only)

### Interactions
- [ ] All clickable elements have `cursor-pointer`
- [ ] All transitions are 150-300ms
- [ ] Focus states visible with gold ring (`focus-visible:ring-2 ring-gold`)
- [ ] Disabled states use `opacity-50 cursor-not-allowed`

### Components
- [ ] Button variants match design system (primary, secondary, ghost, outline)
- [ ] Card hover states use scale transform
- [ ] Input error states show red border + message
- [ ] All components use `cn()` for class composition

### Code Quality
- [ ] No React hooks (useState, useEffect, etc.)
- [ ] SolidJS patterns used (createSignal, createResource, Show, For)
- [ ] TypeScript strict mode with no type errors
- [ ] Import order convention followed

---

## AI Agent Instructions

### 🤖 Critical Rules for AI Coding Agents

#### 1. **This is SolidJS, NOT React**

```typescript
// ❌ WRONG (React)
import { useState, useEffect } from 'react';
const [count, setCount] = useState(0);

// ✅ CORRECT (SolidJS)
import { createSignal, createEffect } from 'solid-js';
const [count, setCount] = createSignal(0);
```

**Key Differences:**
- Use `createSignal()` NOT `useState()`
- Use `createEffect()` NOT `useEffect()`
- Use `createResource()` NOT `useQuery()` or `useEffect()` for data fetching
- Use `<Show>` and `<For>` NOT `{condition && <div>}` or `.map()`
- Signal getters are functions: `count()` NOT `count`

#### 2. **Icon Library**

```typescript
// ❌ WRONG
import { Plus } from 'lucide-react';

// ✅ CORRECT
import { Plus } from 'lucide-solid';
```

#### 3. **CSS Class Composition**

```typescript
// ✅ ALWAYS use cn() utility from Button.tsx
import { cn } from './components/ui/Button';

const className = cn(
  'base-class',
  condition && 'conditional-class',
  props.class  // Allow class override
);
```

#### 4. **Component Export Patterns**

```typescript
// ✅ Page components: default export
export default function Home() { /* ... */ }

// ✅ Reusable components: named export
export function Button(props: ButtonProps) { /* ... */ }
```

#### 5. **Design System Rules**

| Rule | Implementation |
|------|---------------|
| **Colors** | Use Tailwind classes mapped to CSS variables (e.g., `bg-gold`, `text-gray-dark`) |
| **Icons** | Only lucide-solid, NO emojis |
| **Transitions** | 150-300ms (`transition-all duration-200`) |
| **Focus States** | Always visible (`focus-visible:ring-2 ring-gold`) |
| **Clickable Elements** | Always include `cursor-pointer` |
| **Hover Effects** | Scale/opacity only, NO layout shifts |

#### 6. **S3 Service Pattern**

```typescript
// ✅ All S3 functions take connection as first param
async function listBuckets(connection: S3Connection): Promise<Bucket[]> {
  const client = getS3Client(connection);
  // ...
}

// ✅ S3 clients are cached per connection ID
const clientCache = new Map<string, S3Client>();
```

#### 7. **State Management**

```typescript
// ✅ Use createStore for complex state
import { createStore } from 'solid-js/store';
const [connections, setConnections] = createStore<S3Connection[]>([]);

// ✅ Persist to localStorage on mutations
setConnections((prev) => [...prev, newConnection]);
localStorage.setItem('s3-manager-connections', JSON.stringify(connections));
```

#### 8. **File Paths**

All file paths in code MUST be relative to [`src/`](src/):
- `'../components/ui/Button'` (from pages)
- `'./components/ui/Button'` (from src root)
- `'../services/s3'` (from pages)

#### 9. **TypeScript Strict Mode**

```typescript
// ✅ Always type function parameters
function addConnection(connection: Omit<S3Connection, 'id'>): void

// ✅ Use interfaces for objects
interface ButtonProps {
  variant?: 'primary' | 'secondary';
}

// ✅ Use Omit for partial types
type NewConnection = Omit<S3Connection, 'id'>;
```

#### 10. **Design Anti-Patterns (NEVER USE)**

❌ Emojis as icons  
❌ Dark mode (not implemented)  
❌ React hooks  
❌ Layout-shifting hover effects  
❌ Instant state changes (no transitions)  
❌ Invisible focus states  
❌ Low contrast text  

#### 11. **Component Composition**

```typescript
// ✅ Use splitProps to forward props
import { splitProps } from 'solid-js';

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ['variant', 'size']);
  return <button {...others} class={cn(getVariantClass(local.variant))} />;
}
```

#### 12. **Async Data Fetching**

```typescript
// ✅ Use createResource for async data
import { createResource } from 'solid-js';

const [buckets, { refetch }] = createResource(() => 
  listBuckets(connection())
);

// ✅ Automatic loading/error states
<Show when={buckets()} fallback={<p>Loading...</p>}>
  {(data) => <div>{data().length} buckets</div>}
</Show>
```

### Quick Reference Card

| Task | SolidJS Pattern | React Pattern (DON'T USE) |
|------|----------------|---------------------------|
| Local state | `createSignal()` | `useState()` ❌ |
| Side effects | `createEffect()` | `useEffect()` ❌ |
| Async data | `createResource()` | `useQuery()` / fetch in `useEffect()` ❌ |
| Conditional render | `<Show when={condition}>` | `{condition && <div>}` ❌ |
| List render | `<For each={items()}>` | `{items.map()}` ❌ |
| Signal read | `count()` | `count` ❌ |
| Signal write | `setCount(1)` | `setCount(1)` ✅ |

---

## License

MIT License - see LICENSE file for details

---

## Additional Resources

- [SolidJS Documentation](https://www.solidjs.com/docs/latest)
- [Design System Master Document](design-system/s3-manager/MASTER.md)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Lucide Icons (SolidJS)](https://lucide.dev/guide/packages/lucide-solid)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated:** 2026-02-11  
**Version:** 1.0.0  
**Maintained by:** S3 Storage Manager Team
