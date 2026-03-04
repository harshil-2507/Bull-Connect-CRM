export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercentage(value: number) {
  return `${value.toFixed(2)}%`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value)
}