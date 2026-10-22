// Universal dynamic variant & attribute pricing engine.
// Normalizes every category's selectable attributes into additive add-on pricing
// on top of the product's primary variant price.

export type CustomOption = {
  label: string;
  priceDelta?: number;
};

export type CustomOptionGroup = {
  name: string;
  options: CustomOption[];
};

export type ProductWithOptions = {
  basePrice?: number;
  customOptions?: CustomOptionGroup[];
  [key: string]: unknown;
};

export function getCustomGroups(product: ProductWithOptions | null | undefined): CustomOptionGroup[] {
  if (!product || !Array.isArray(product.customOptions)) return [];
  return product.customOptions.filter(
    (g) => g && typeof g.name === 'string' && g.name.trim() && Array.isArray(g.options) && g.options.length > 0
  );
}

export function defaultSelection(product: ProductWithOptions | null | undefined): Record<string, number> {
  return Object.fromEntries(getCustomGroups(product).map((g) => [g.name, 0]));
}

export function optionsTotal(
  product: ProductWithOptions | null | undefined,
  selected: Record<string, number>
): number {
  let total = 0;
  for (const g of getCustomGroups(product)) {
    const opt = g.options[selected[g.name] ?? 0];
    if (opt && typeof opt.priceDelta === 'number') total += opt.priceDelta;
  }
  return total;
}

export function optionsLabel(
  product: ProductWithOptions | null | undefined,
  selected: Record<string, number>
): string {
  const parts: string[] = [];
  for (const g of getCustomGroups(product)) {
    const opt = g.options[selected[g.name] ?? 0];
    if (opt) parts.push(`${g.name}: ${opt.label}`);
  }
  return parts.join(' • ');
}

// Text format for admins, one group per line:
//   GroupName: Option A, Option B +500, Option C -200
export function parseOptionsText(text: string): CustomOptionGroup[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(':');
      const name = colonIdx >= 0 ? line.slice(0, colonIdx).trim() : 'Options';
      const optsPart = colonIdx >= 0 ? line.slice(colonIdx + 1) : line;
      const options = optsPart
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean)
        .map((o) => {
          const m = o.match(/^(.*?)(?:\s*([+-])\s*₹?\s*(\d+))?$/);
          const label = (m?.[1] ?? o).trim();
          const priceDelta = m?.[2] && m?.[3] ? Number(m[3]) * (m[2] === '-' ? -1 : 1) : undefined;
          return priceDelta !== undefined ? { label, priceDelta } : { label };
        })
        .filter((o) => o.label);
      return { name, options };
    })
    .filter((g) => g.options.length > 0);
}

export function serializeOptions(groups: CustomOptionGroup[] | undefined): string {
  if (!Array.isArray(groups)) return '';
  return groups
    .map((g) => {
      const opts = g.options
        .map((o) => {
          if (typeof o.priceDelta !== 'number') return o.label;
          return o.priceDelta >= 0 ? `${o.label} +${o.priceDelta}` : `${o.label} ${o.priceDelta}`;
        })
        .join(', ');
      return `${g.name}: ${opts}`;
    })
    .join('\n');
}
