import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseProductInput } from '../lib/ai-parser';
import { db } from '@listonic/db';
import { stores } from '@listonic/db/schema';

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
      // Get all stores to include in system prompt
      const allStores = await db.select().from(stores);
      const parsed = await parseProductInput(input, allStores);

      // Validate that returned storeId exists
      const validStoreId = parsed.storeId && allStores.some(s => s.id === parsed.storeId)
        ? parsed.storeId
        : null;

      return c.json({
        success: true,
        data: {
          name: parsed.name,
          qty: parsed.qty,
          unit: parsed.unit,
          note: parsed.note,
          category: parsed.category,
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
