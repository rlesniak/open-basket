import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@listonic/db';
import { stores, categories, storeCategoryOrders, products } from '@listonic/db/schema';
import { os } from '@orpc/server';
import type { Context } from './context';

const o = os.$context<Context>();

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  note: z.string().nullable(),
  categoryId: z.string(),
  isPurchased: z.boolean(),
  createdAt: z.number(),
});

const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  orderIndex: z.number(),
});

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

// Stores
const getStores = o
  .output(z.array(StoreSchema))
  .handler(async () => {
    const result = await db.select().from(stores).orderBy(stores.orderIndex);
    return result;
  });

// Categories
const getCategories = o
  .output(z.array(CategorySchema))
  .handler(async () => {
    const result = await db.select().from(categories);
    return result;
  });

const getStoreCategoryOrders = o
  .input(z.object({ storeId: z.string() }))
  .output(z.array(z.object({ categoryId: z.string(), orderIndex: z.number() })))
  .handler(async ({ input }) => {
    const result = await db
      .select({
        categoryId: storeCategoryOrders.categoryId,
        orderIndex: storeCategoryOrders.orderIndex,
      })
      .from(storeCategoryOrders)
      .where(eq(storeCategoryOrders.storeId, input.storeId));
    return result;
  });

const updateCategoryOrder = o
  .input(z.object({ 
    storeId: z.string(), 
    categoryId: z.string(), 
    orderIndex: z.number() 
  }))
  .handler(async ({ input }) => {
    await db
      .insert(storeCategoryOrders)
      .values({
        storeId: input.storeId,
        categoryId: input.categoryId,
        orderIndex: input.orderIndex,
      })
      .onConflictDoUpdate({
        target: [storeCategoryOrders.storeId, storeCategoryOrders.categoryId],
        set: { orderIndex: input.orderIndex },
      });
  });

// Products
const getProducts = o
  .output(z.array(ProductSchema))
  .handler(async () => {
    const result = await db.select().from(products).orderBy(products.createdAt);
    return result;
  });

const addProduct = o
  .input(z.object({
    name: z.string(),
    qty: z.number().nullable(),
    unit: z.string().nullable(),
    note: z.string().nullable(),
    categoryId: z.string(),
  }))
  .output(ProductSchema)
  .handler(async ({ input }) => {
    const id = crypto.randomUUID();
    const createdAt = Date.now();
    
    const newProduct = {
      id,
      name: input.name,
      qty: input.qty,
      unit: input.unit,
      note: input.note,
      categoryId: input.categoryId,
      isPurchased: false,
      createdAt,
    };
    
    await db.insert(products).values(newProduct);
    return newProduct;
  });

const toggleProduct = o
  .input(z.object({ productId: z.string(), isPurchased: z.boolean() }))
  .handler(async ({ input }) => {
    await db
      .update(products)
      .set({ isPurchased: input.isPurchased })
      .where(eq(products.id, input.productId));
  });

const deleteProduct = o
  .input(z.object({ productId: z.string() }))
  .handler(async ({ input }) => {
    await db
      .delete(products)
      .where(eq(products.id, input.productId));
  });

const clearPurchased = o
  .handler(async () => {
    await db
      .delete(products)
      .where(eq(products.isPurchased, true));
  });

const updateProduct = o
  .input(z.object({
    productId: z.string(),
    name: z.string(),
    qty: z.number().nullable(),
    unit: z.string().nullable(),
    note: z.string().nullable(),
    categoryId: z.string(),
  }))
  .output(ProductSchema)
  .handler(async ({ input }) => {
    await db
      .update(products)
      .set({
        name: input.name,
        qty: input.qty,
        unit: input.unit,
        note: input.note,
        categoryId: input.categoryId,
      })
      .where(eq(products.id, input.productId));

    const updatedProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId))
      .then(rows => rows[0]);

    if (!updatedProduct) {
      throw new Error('Product not found');
    }

    return updatedProduct;
  });

export const shoppingRouter = {
  // Stores
  getStores,
  // Categories
  getCategories,
  getStoreCategoryOrders,
  updateCategoryOrder,
  // Products
  getProducts,
  addProduct,
  updateProduct,
  toggleProduct,
  deleteProduct,
  clearPurchased,
};

export type ShoppingRouter = typeof shoppingRouter;
