const API_URL = "https://open.er-api.com/v6/latest/USD"; // Free API for currency rates

export async function fetchForexRates() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch currency rates");

    const data = await response.json();
    return data.rates; // Returns an object like { USD: 1, EUR: 0.93, GBP: 0.79, ... }
  } catch (error) {
    console.error("Error fetching rates:", error);
    return null; // Handle fallback here
  }
}

export function convertCurrency(amount, fromRate, toRate) {
  return (amount / fromRate) * toRate;
}
