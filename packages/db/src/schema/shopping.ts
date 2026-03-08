import { pgTable, text, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
  keywords: text('keywords'), // Comma-separated keywords like "deli,z deli"
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const storeCategoryOrders = pgTable('store_category_orders', {
  storeId: text('store_id').notNull(),
  categoryId: text('category_id').notNull(),
  orderIndex: integer('order_index').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.storeId, table.categoryId] }),
}));

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  qty: integer('qty'), // Only whole numbers, null if not specified
  unit: text('unit'), // "szt", "kg", "l", etc. or null
  note: text('note'), // Additional info like "3.2%", "koniecznie z cisowianka"
  categoryId: text('category_id').notNull(),
  isPurchased: boolean('is_purchased').notNull().default(false),
  assignedStoreId: text('assigned_store_id'), // null = global product, else specific store
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Default data
export const DEFAULT_STORES = [
  { id: 'biedronka', name: 'Biedronka', orderIndex: 0 },
  { id: 'lidl', name: 'Lidl', orderIndex: 1 },
  { id: 'kaufland', name: 'Kaufland', orderIndex: 2 },
  { id: 'auchan', name: 'Auchan', orderIndex: 3 },
];

export const DEFAULT_CATEGORIES = [
  { id: 'owoce-warzywa', name: 'Owoce i warzywa' },
  { id: 'pieczywo', name: 'Pieczywo' },
  { id: 'pieczenie', name: 'Pieczenie i dodatki' },
  { id: 'nabial-jajka', name: 'Nabiał i jajka' },
  { id: 'sypkie', name: 'Sypkie' },
  { id: 'ryby', name: 'Ryby' },
  { id: 'mrozonki', name: 'Mrożonki' },
  { id: 'konserwy', name: 'Konserwy i przetwory' },
  { id: 'mieso-wedliny', name: 'Mięso i wędliny' },
  { id: 'slodycze-przekaski', name: 'Słodycze i przekąski' },
  { id: 'przyprawy', name: 'Przyprawy, sosy i oleje' },
  { id: 'woda-napoje', name: 'Woda i napoje' },
  { id: 'kawa-herbata', name: 'Kawa i herbata' },
  { id: 'alkohole', name: 'Alkohole' },
  { id: 'higiena', name: 'Higiena' },
  { id: 'dziecko', name: 'Dziecko' },
  { id: 'apteczka', name: 'Apteczka' },
  { id: 'dom-ogrod', name: 'Dom i ogród' },
  { id: 'czystosc', name: 'Środki czystości' },
  { id: 'inne', name: 'Inne' }
];
