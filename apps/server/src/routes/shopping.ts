import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { parseProductInput } from '../lib/ai-parser';

const parseSchema = z.object({
  input: z.string().min(1),
});

export const shoppingRoute = new Hono()
  .post('/parse-product', zValidator('json', parseSchema), async (c) => {
    const { input } = c.req.valid('json');
    
    try {
      const result = await parseProductInput(input);
      return c.json({ success: true, data: result });
    } catch (error) {
      console.error('Parse error:', error);
      return c.json({ 
        success: false, 
        error: 'Failed to parse product' 
      }, 500);
    }
  });
