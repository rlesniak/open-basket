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

  const totalItems = items.length;
  const purchasedCount = purchasedItems.length;
  const progressValue =
    totalItems > 0 ? Math.round((purchasedCount / totalItems) * 100) : 0;
  const pendingCategoryCount = categoryOrder.size;

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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(28,28,31,0.96),rgba(18,18,20,0.98))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-[11px] text-zinc-500 uppercase tracking-[0.24em]">
              Trasa zakupowa
            </p>
            <h2 className="font-semibold text-[24px] text-zinc-50 leading-tight">
              {purchasedCount} z {totalItems} produktów gotowe
            </h2>
            <p className="text-base text-zinc-400">
              {pendingItems.length} aktywne • {pendingCategoryCount} działy
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/20 bg-amber-300/12 px-4 py-3 text-right text-amber-200">
            <p className="font-medium text-[11px] text-amber-100/80 uppercase tracking-[0.2em]">
              Postęp
            </p>
            <p className="font-semibold text-3xl leading-none">
              {progressValue}%
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/8">
          <motion.div
            animate={{ width: `${progressValue}%` }}
            className="h-full rounded-full bg-[linear-gradient(90deg,#22c55e,#f59e0b)]"
            initial={{ width: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-2 font-medium text-zinc-200">
            🧺 Aktywne: {pendingItems.length}
          </span>
          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-2 font-medium text-zinc-200">
            ✅ Kupione: {purchasedCount}
          </span>
          <span className="rounded-full border border-white/8 bg-white/4 px-3 py-2 font-medium text-zinc-200">
            🏬 Działy: {pendingCategoryCount}
          </span>
        </div>
      </section>

      {/* Pending items grouped by category */}
      <AnimatePresence mode="popLayout">
        {Array.from(categoryOrder.entries()).map(([categoryId, catItems]) => {
          const categoryColor =
            getCategoryColor(categoryId) ?? "hsl(var(--muted))";

          return (
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(15,15,18,0.98))] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
              exit={{ opacity: 0, y: -20 }}
              initial={{ opacity: 0, y: 20 }}
              key={categoryId}
              layout
            >
              <div
                aria-hidden="true"
                className="absolute top-0 bottom-0 left-0 w-1.5"
                style={{ backgroundColor: categoryColor }}
              />

              <div
                className="border-b px-4 py-3 backdrop-blur-sm"
                style={{
                  backgroundColor: `${categoryColor}18`,
                  borderBottomColor: `${categoryColor}24`,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[18px] text-zinc-50 leading-none">
                      {getCategoryLabel(categoryId)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 font-semibold text-xs text-zinc-100">
                    {catItems.length}
                  </span>
                </div>
              </div>

              <motion.div
                animate="visible"
                className="px-2 py-2 pl-4 sm:px-3"
                initial="hidden"
                variants={containerVariants}
              >
                <div className="overflow-hidden rounded-[18px] border border-white/8 bg-white/4">
                  <AnimatePresence mode="popLayout">
                    {catItems.map((item, index) => (
                      <motion.div
                        animate="visible"
                        className={
                          index > 0 ? "border-white/8 border-t" : undefined
                        }
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
                </div>
              </motion.div>
            </motion.section>
          );
        })}
      </AnimatePresence>

      {/* Purchased items section */}
      {purchasedItems.length > 0 && (
        <motion.section
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(20,24,22,0.94),rgba(14,18,16,0.98))] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
          initial={{ opacity: 0 }}
          layout
        >
          <div className="flex items-center justify-between gap-3 border-white/8 border-b bg-white/3 px-4 py-3">
            <div>
              <h3 className="font-semibold text-[18px] text-zinc-50">
                ✅ Gotowe
              </h3>
            </div>
            <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-semibold text-emerald-200 text-xs">
              {purchasedItems.length}
            </span>
          </div>

          <motion.div
            animate="visible"
            className="px-2 py-2 sm:px-3"
            initial="hidden"
            variants={containerVariants}
          >
            <div className="overflow-hidden rounded-[18px] border border-white/8 bg-white/4">
              <AnimatePresence mode="popLayout">
                {purchasedItems.map((item, index) => (
                  <motion.div
                    animate="visible"
                    className={
                      index > 0 ? "border-white/8 border-t" : undefined
                    }
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
            </div>
          </motion.div>
        </motion.section>
      )}

      {/* Empty state */}
      {pendingItems.length === 0 && purchasedItems.length === 0 && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 border-dashed bg-[linear-gradient(180deg,rgba(22,22,26,0.96),rgba(12,12,15,0.98))] p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
        >
          <div className="mb-3 rounded-full bg-white/6 p-4 shadow-inner">
            <span className="text-3xl">🛒</span>
          </div>
          <p className="font-semibold text-base text-zinc-50">
            Brak produktów na liście
          </p>
          <p className="mt-2 max-w-60 text-sm text-zinc-400">
            Dodaj produkty używając pola powyżej
          </p>
        </motion.div>
      )}
    </div>
  );
}
