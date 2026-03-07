import { Product } from '../types/shopping';

export const formatProductText = (product: Product): string => {
  let text = product.name;
  if (product.qty !== null && product.unit) {
    text += ` (${product.qty} ${product.unit})`;
  } else if (product.qty !== null) {
    text += ` (${product.qty})`;
  }
  if (product.note) {
    text += ` - ${product.note}`;
  }
  return text;
};
