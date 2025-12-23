function parseListSection(source = '', label) {
  const regex = new RegExp(`${label}\\s*:\\s*([^\\n|]+)`, 'i');
  const match = source.match(regex);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

export function extractVariantOptions(product) {
  const colorOptions = Array.isArray(product?.color_options) ? product.color_options : [];
  const sizeOptions = Array.isArray(product?.size_options) ? product.size_options : [];

  const fallbackColors = Array.isArray(product?.variants?.colors) ? product.variants.colors : [];
  const fallbackSizes = Array.isArray(product?.variants?.sizes) ? product.variants.sizes : [];

  let colors = colorOptions.length > 0 ? colorOptions : fallbackColors;
  let sizes = sizeOptions.length > 0 ? sizeOptions : fallbackSizes;

  if ((colors.length === 0 || sizes.length === 0) && typeof product?.description === 'string') {
    const parsedColors = colors.length === 0 ? parseListSection(product.description, 'Colors?') : [];
    const parsedSizes = sizes.length === 0 ? parseListSection(product.description, 'Sizes?') : [];
    if (parsedColors.length > 0) {
      colors = parsedColors;
    }
    if (parsedSizes.length > 0) {
      sizes = parsedSizes;
    }
  }

  return { colors, sizes };
}
