# Lista Zakupów PWA - Design Document

## Overview

Mobilna-first aplikacja do list zakupów z AI ekstrakcją produktów z naturalnego języka.

## Architecture

**Stack:**
- TanStack Start (routing + server functions)
- TanStack Query (cache, optimistic updates)
- Framer Motion (animations)
- shadcn/ui + Tailwind
- React 19 + TypeScript
- Vercel AI SDK
- SQLite (libsql/Turso) + Drizzle ORM

**Structure:** FSD (Feature Sliced Design) + kebab-case

## Data Model

### Tables

**stores**
- id: string (PK)
- name: string
- created_at: datetime

**categories**
- id: string (PK)
- name: string
- icon: string
- color: string

**store_categories** (junction table for category order per store)
- store_id: string (FK)
- category_id: string (FK)
- position: integer
- PK: (store_id, category_id)

**shopping_items**
- id: string (PK)
- name: string
- quantity: string | null
- category_id: string (FK → categories, ON DELETE SET 'inne')
- note: string | null
- status: enum('pending', 'purchased', 'cancelled')
- created_at: datetime
- updated_at: datetime

**category_mappings** (AI learning)
- id: string (PK)
- input_pattern: string
- category_id: string (FK)
- frequency: integer
- created_at: datetime

## Key Decisions

### AI Extraction
- Model: gpt-4o-mini
- Prompt: Simple system prompt + user input
- Returns: {name, quantity, category, note}
- Fallback: Full text as name, empty fields
- Optimistic update: Product appears immediately, AI processes in background
- Learning: User corrections saved to category_mappings

### UI/UX
- One global list for all users
- Store selection changes category order only
- Sections by category (empty categories hidden)
- "Purchased" section at bottom (opacity 0.6, strikethrough)
- Input with autocomplete (history + frequency)
- Drag & drop for category ordering in store management
- Sticky footer with input
- Actions via "..." menu (delete, edit)

### Flow
1. User types in input (e.g., "2 kg jabłek na szarlotkę")
2. Optimistic update: Product appears as "processing"
3. Server function calls AI SDK
4. Product updated with extracted data
5. If AI fails: Product stays with full text as name

## File Structure

```
apps/web/src/
├── entities/
│   ├── shopping-item/
│   │   ├── api.ts
│   │   ├── model.ts
│   │   └── queries.ts
│   ├── store/
│   │   ├── api.ts
│   │   ├── model.ts
│   │   └── queries.ts
│   └── category/
│       ├── api.ts
│       ├── model.ts
│       └── queries.ts
├── features/
│   ├── add-item/
│   │   ├── add-item-input.tsx
│   │   ├── use-add-item.ts
│   │   └── ai-extraction.ts
│   ├── item-list/
│   │   ├── item-list.tsx
│   │   ├── item-card.tsx
│   │   └── item-actions.tsx
│   ├── store-selector/
│   │   ├── store-selector.tsx
│   │   └── store-dropdown.tsx
│   └── store-management/
│       ├── store-list.tsx
│       ├── category-order-editor.tsx
│       └── create-store-form.tsx
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   ├── header.tsx
│   │   └── loader.tsx
│   ├── lib/
│   │   ├── ai-client.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   └── hooks/
│       └── use-optimistic.ts
└── routes/
    ├── __root.tsx
    ├── index.tsx
    └── stores.tsx

packages/db/src/
├── schema/
│   ├── stores.ts
│   ├── categories.ts
│   ├── store-categories.ts
│   ├── shopping-items.ts
│   └── category-mappings.ts
└── index.ts
```

## Out of Scope (MVP)

- PWA / offline mode
- Authentication / multiple users
- Voice input
- Price tracking
- Multiple lists (historical)
- Sharing lists

## MVP Features

- [ ] Add items via AI extraction
- [ ] Optimistic updates with status indicators
- [ ] Store management with custom category ordering
- [ ] Mark items as purchased (animated to bottom section)
- [ ] Delete items via menu
- [ ] Sorting: pending first, then by store's category order
- [ ] Mobile-first responsive design
- [ ] Input autocomplete from history
- [ ] AI learning from user corrections

## Default Categories

1. Warzywa i owoce
2. Nabiał
3. Mięso i ryby
4. Piekarnia
5. Suche produkty
6. Mrożonki
7. Napoje
8. Chemia
9. Inne
