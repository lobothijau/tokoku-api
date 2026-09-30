// Perhitungan harga. Semua angka adalah bilangan bulat dalam rupiah.

export function lineSubtotal(price, quantity) {
  return price * quantity;
}

// lines: [{ subtotal }, ...]
export function orderTotal(lines) {
  return lines.reduce((total, line) => total + line.subtotal, 0);
}
