import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoriesQueryOptions } from "@/entities/category/queries";
import {
  createShoppingItem,
  updateShoppingItem,
} from "@/entities/shopping-item/api";
import { extractItemDetails } from "./ai-extraction";

export function useAddItem() {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories } = useQuery(categoriesQueryOptions());

  const addItemMutation = useMutation({
    mutationFn: createShoppingItem,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["shopping-items"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: updateShoppingItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items"] });
    },
  });

  const handleSubmit = async () => {
    if (!input.trim()) {
      return;
    }

    setIsProcessing(true);

    const categoryNames = categories?.map((c) => c.name) || [];

    try {
      const result = await addItemMutation.mutateAsync({
        data: {
          name: input,
          quantity: null,
          categoryId: null,
          note: null,
        },
      });

      try {
        const extracted = await extractItemDetails({
          data: {
            text: input,
            allCategories: categoryNames,
          },
        });

        const category = categories?.find((c) => c.name === extracted.category);

        await updateItemMutation.mutateAsync({
          data: {
            id: result.id,
            input: {
              name: extracted.name,
              quantity: extracted.quantity,
              categoryId: category?.id || null,
              note: extracted.note,
            },
          },
        });
      } catch {
        // Extraction failed, item remains with raw input
      }
    } finally {
      setIsProcessing(false);
      setInput("");
    }
  };

  return {
    input,
    setInput,
    isProcessing,
    handleSubmit,
  };
}
