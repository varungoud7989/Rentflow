/**
 * Reusable utility for formatting currency amounts into Indian Rupees (INR / ₹)
 * Handles null, undefined, and non-numeric values safely.
 *
 * @param {number|string} amount
 * @returns {string} Formatted INR currency string (e.g. "₹25,000")
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
};
