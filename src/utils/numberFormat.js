// utils/numberFormat.js
export function makeFormatter(scale = "rupiah") {
  const divisors = {
    rupiah: 1,
    juta: 1_000_000,
    miliar: 1_000_000_000,
    triliun: 1_000_000_000_000,
  };

  const labels = {
    rupiah: "Rp",
    juta: "Jutaan",
    miliar: "Miliar",
    triliun: "Triliun",
  };

  const divisor = divisors[scale] || 1;
  const label = labels[scale] || "";

  return (num) => {
    if (num == null || isNaN(num)) return "-";
    return `${(num / divisor).toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${label}`;
  };
}
