import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseProductInput } from '../lib/ai-parser';
import { db } from '@open-basket/db';
import { stores, categories } from '@open-basket/db/schema';

const parseSchema = z.object({
  input: z.string().min(1),
});

export const shoppingRoute = new Hono()
  .get('/stores', async (c) => {
    const allStores = await db.select().from(stores).orderBy(stores.orderIndex);
    return c.json({ success: true, data: allStores });
  })
  .post('/parse-product-with-store', zValidator('json', parseSchema), async (c) => {
    const { input } = c.req.valid('json');

    try {
      // Get all stores and categories to include in system prompt
      const allStores = await db.select().from(stores);
      const allCategories = await db.select().from(categories);
      const parsed = await parseProductInput(input, allStores, allCategories);

      // Validate that returned IDs exist
      const validStoreId = parsed.storeId && allStores.some(s => s.id === parsed.storeId)
        ? parsed.storeId
        : null;
      const validCategoryId = allCategories.some(c => c.id === parsed.categoryId)
        ? parsed.categoryId
        : 'inne';

      return c.json({
        success: true,
        data: {
          name: parsed.name,
          qty: parsed.qty,
          unit: parsed.unit,
          note: parsed.note,
          categoryId: validCategoryId,
          assignedStoreId: validStoreId
        }
      });
    } catch (error) {
      console.error('Parse error:', error);
      return c.json({
        success: false,
        error: 'Failed to parse product'
      }, 500);
    }
  });
