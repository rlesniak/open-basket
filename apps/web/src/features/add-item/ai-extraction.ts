import { categoryMappings, db } from "@open-basket/db";
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { aiModel } from "@/shared/lib/ai-client";

export const extractionSchema = z.object({
  name: z.string().describe("The product name"),
  quantity: z
    .string()
    .nullable()
    .describe('Quantity with unit, e.g., "2 kg", "3 pieces", "500ml"'),
  category: z
    .string()
    .describe("Best matching category from the available list"),
  note: z.string().nullable().describe("Any additional notes or context"),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;

const SYSTEM_PROMPT = `Extract shopping item details from user input.
Available categories: {categories}

Respond with JSON containing:
- name: product name
- quantity: amount with unit (or null if not specified)
- category: best matching category name from the list
- note: any additional context (or null)

Examples:
"2 kg jabłek na szarlotkę" → {name: "jabłka", quantity: "2 kg", category: "Warzywa i owoce", note: "na szarlotkę"}
"mleko" → {name: "mleko", quantity: null, category: "Nabiał", note: null}`;

export const extractItemDetails = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string; allCategories: string[] }) => input)
  .handler(async ({ data }) => {
    try {
      // Get learned mappings for similar inputs
      const learnedMappings = await db
        .select()
        .from(categoryMappings)
        .orderBy(desc(categoryMappings.frequency))
        .limit(10);

      const context =
        learnedMappings.length > 0
          ? `\n\nLearned patterns:\n${learnedMappings
              .map((m) => `"${m.inputPattern}" → ${m.categoryId}`)
              .join("\n")}`
          : "";

      const prompt =
        SYSTEM_PROMPT.replace("{categories}", data.allCategories.join(", ")) +
        context;

      const { output } = await generateText({
        model: aiModel,
        output: Output.object({
          schema: extractionSchema,
        }),
        prompt: `${prompt}\n\nInput: "${data.text}"`,
      });

      return output;
    } catch (error) {
      console.error("AI extraction failed:", error);
      // Fallback: return input as name
      return {
        name: data.text,
        quantity: null,
        category: "Inne",
        note: null,
      };
    }
  });
