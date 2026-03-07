export type Store = {
  id: string;
  name: string;
  orderIndex: number;
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  qty: number | null;
  unit: string | null;
  note: string | null;
  categoryId: string;
  isPurchased: boolean;
  createdAt: number;
};

export type StoreCategoryOrder = {
  categoryId: string;
  orderIndex: number;
};

export type ParsedProduct = {
  name: string;
  qty: number | null;
  unit: string | null;
  note: string | null;
  category: string;
};
