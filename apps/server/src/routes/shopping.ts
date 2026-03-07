import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseProductInput, matchStoreFromKeywords } from '../lib/ai-parser';
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
      const parsed = await parseProductInput(input);

      // Get all stores to match against keywords
      const allStores = await db.select().from(stores);
      const matchedStoreId = await matchStoreFromKeywords(parsed.store, allStores);

      return c.json({
        success: true,
        data: {
          ...parsed,
          assignedStoreId: matchedStoreId
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
