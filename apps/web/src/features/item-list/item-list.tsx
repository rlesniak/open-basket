"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import type { CategoryWithPosition } from "@/entities/category/model";
import type { ShoppingItemWithCategory } from "@/entities/shopping-item/model";
import { ItemCard } from "./item-card";

interface ItemListProps {
  categories: CategoryWithPosition[];
  items: ShoppingItemWithCategory[];
  onDelete: (id: string) => void;
  onEdit: (item: ShoppingItemWithCategory) => void;
  onToggleStatus: (id: string, status: "pending" | "purchased") => void;
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export function ItemList({
  items,
  categories,
  onToggleStatus,
  onEdit,
  onDelete,
}: ItemListProps) {
  const { pendingItems, purchasedItems, categoryOrder } = useMemo(() => {
    const pending: ShoppingItemWithCategory[] = [];
    const purchased: ShoppingItemWithCategory[] = [];

    for (const item of items) {
      if (item.status === "purchased") {
        purchased.push(item);
      } else {
        pending.push(item);
      }
    }

    // Create category order map from store categories
    const orderMap = new Map<string, number>();
    for (const cat of categories) {
      orderMap.set(cat.id, cat.position);
    }

    // Sort pending items by category position
    const sortedPending = [...pending].sort((a, b) => {
      const posA = a.categoryId ? (orderMap.get(a.categoryId) ?? 999) : 999;
      const posB = b.categoryId ? (orderMap.get(b.categoryId) ?? 999) : 999;
      return posA - posB;
    });

    // Group pending items by category
    const grouped = new Map<string, ShoppingItemWithCategory[]>();
    for (const item of sortedPending) {
      const catId = item.categoryId ?? "uncategorized";
      const group = grouped.get(catId) ?? [];
      group.push(item);
      grouped.set(catId, group);
    }

    return {
      pendingItems: sortedPending,
      purchasedItems: purchased,
      categoryOrder: grouped,
    };
  }, [items, categories]);

  const getCategoryLabel = (categoryId: string) => {
    if (categoryId === "uncategorized") {
      return "📦 Inne";
    }

    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      return "📦 Inne";
    }

    return category.icon ? `${category.icon} ${category.name}` : category.name;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color;
  };

  return (
    <div className="space-y-6">
      {/* Pending items grouped by category */}
      <AnimatePresence mode="popLayout">
        {Array.from(categoryOrder.entries()).map(([categoryId, catItems]) => {
          const categoryColor =
            getCategoryColor(categoryId) ?? "hsl(var(--muted))";

          return (
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border bg-card shadow-sm"
              exit={{ opacity: 0, y: -20 }}
              initial={{ opacity: 0, y: 20 }}
              key={categoryId}
              layout
            >
              <div
                className="flex items-center gap-2 border-b bg-linear-to-r px-4 py-2"
                style={{
                  backgroundColor: `${categoryColor}15`,
                  borderLeftWidth: "4px",
                  borderLeftColor: categoryColor,
                }}
              >
                <h3 className="font-semibold text-sm">
                  {getCategoryLabel(categoryId)}
                </h3>
                <span className="font-medium text-muted-foreground text-xs">
                  {catItems.length}
                </span>
              </div>

              <motion.div
                animate="visible"
                className="flex flex-col gap-2 p-3"
                initial="hidden"
                variants={containerVariants}
              >
                <AnimatePresence mode="popLayout">
                  {catItems.map((item) => (
                    <motion.div
                      animate="visible"
                      exit="exit"
                      initial="hidden"
                      key={item.id}
                      layout
                      variants={itemVariants}
                    >
                      <ItemCard
                        item={item}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onToggleStatus={onToggleStatus}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.section>
          );
        })}
      </AnimatePresence>

      {/* Purchased items section */}
      {purchasedItems.length > 0 && (
        <motion.section
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border bg-muted/30 shadow-sm"
          initial={{ opacity: 0 }}
          layout
        >
          <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
            <h3 className="font-semibold text-muted-foreground text-sm">
              ✅ Kupione
            </h3>
            <span className="font-medium text-muted-foreground text-xs">
              {purchasedItems.length}
            </span>
          </div>

          <motion.div
            animate="visible"
            className="flex flex-col gap-2 p-3"
            initial="hidden"
            variants={containerVariants}
          >
            <AnimatePresence mode="popLayout">
              {purchasedItems.map((item) => (
                <motion.div
                  animate="visible"
                  exit="exit"
                  initial="hidden"
                  key={item.id}
                  layout
                  variants={itemVariants}
                >
                  <ItemCard
                    item={item}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </motion.section>
      )}

      {/* Empty state */}
      {pendingItems.length === 0 && purchasedItems.length === 0 && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
        >
          <div className="mb-2 rounded-full bg-muted p-3">
            <span className="text-2xl">🛒</span>
          </div>
          <p className="font-medium text-sm">Brak produktów na liście</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Dodaj produkty używając pola powyżej
          </p>
        </motion.div>
      )}
    </div>
  );
}
