export const CATEGORY_EMOJIS: Record<string, string> = {
  'owoce-warzywa': '🍎',
  'pieczywo': '🥖',
  'pieczenie': '🧁',
  'nabial-jajka': '🥛',
  'sypkie': '🌾',
  'ryby': '🐟',
  'mrozonki': '🧊',
  'konserwy': '🥫',
  'mieso-wedliny': '🥩',
  'slodycze-przekaski': '🍬',
  'przyprawy': '🌿',
  'woda-napoje': '💧',
  'kawa-herbata': '☕',
  'alkohole': '🍷',
  'higiena': '🧼',
  'dziecko': '👶',
  'apteczka': '💊',
  'dom-ogrod': '🏠',
  'czystosc': '🧽',
  'inne': '📦',
};

export const getCategoryEmoji = (categoryId: string): string => {
  const emoji = CATEGORY_EMOJIS[categoryId];
  if (!emoji) {
    console.warn(`Unknown category ID: "${categoryId}"`);
  }
  return emoji || '📦';
};
