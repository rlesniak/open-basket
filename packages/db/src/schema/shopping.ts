import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const stores = sqliteTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const storeCategoryOrders = sqliteTable('store_category_orders', {
  storeId: text('store_id').notNull(),
  categoryId: text('category_id').notNull(),
  orderIndex: integer('order_index').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.storeId, table.categoryId] }),
}));

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  qty: integer('qty'), // Only whole numbers, null if not specified
  unit: text('unit'), // "szt", "kg", "l", etc. or null
  note: text('note'), // Additional info like "3.2%", "koniecznie z cisowianka"
  categoryId: text('category_id').notNull(),
  isPurchased: integer('is_purchased', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
});

// Default data
export const DEFAULT_STORES = [
  { id: 'biedronka', name: 'Biedronka', orderIndex: 0 },
  { id: 'lidl', name: 'Lidl', orderIndex: 1 },
  { id: 'kaufland', name: 'Kaufland', orderIndex: 2 },
  { id: 'auchan', name: 'Auchan', orderIndex: 3 },
];

export const DEFAULT_CATEGORIES = [
  { id: 'owoce', name: 'Owoce' },
  { id: 'warzywa', name: 'Warzywa' },
  { id: 'nabial', name: 'Nabiał' },
  { id: 'mieso', name: 'Mięso' },
  { id: 'pieczywo', name: 'Pieczywo' },
  { id: 'napoje', name: 'Napoje' },
  { id: 'chemia', name: 'Chemia' },
  { id: 'slodycze', name: 'Słodycze' },
  { id: 'inne', name: 'Inne'}
];
