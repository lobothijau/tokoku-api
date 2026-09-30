// Validasi body POST /orders. Fungsi murni: tidak menyentuh database.
// Hasil: { items } kalau valid, atau { errors } berisi daftar pesan.

const MAX_ITEMS = 20;
const MAX_QUANTITY = 100;

export function validateOrder(body) {
  const items = body?.items;

  if (!Array.isArray(items) || items.length === 0) {
    return { errors: ['items harus berupa array dan tidak boleh kosong'] };
  }
  if (items.length > MAX_ITEMS) {
    return { errors: [`items maksimal ${MAX_ITEMS}`] };
  }

  const errors = [];
  const seen = new Set();

  items.forEach((item, i) => {
    const { productId, quantity } = item ?? {};

    if (!Number.isInteger(productId) || productId < 1) {
      errors.push(`items[${i}].productId harus bilangan bulat positif`);
    } else if (seen.has(productId)) {
      errors.push(`items[${i}].productId ${productId} duplikat`);
    } else {
      seen.add(productId);
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      errors.push(
        `items[${i}].quantity harus bilangan bulat 1-${MAX_QUANTITY}`,
      );
    }
  });

  if (errors.length > 0) return { errors };
  return {
    items: items.map(({ productId, quantity }) => ({ productId, quantity })),
  };
}
