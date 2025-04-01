const API_URL = "https://api.exchangerate-api.com/v4/latest/USD"; // Replace with your actual API URL if needed

export async function fetchForexRates() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    if (data && data.rates) {
      return data.rates;
    }
    return {};
  } catch (error) {
    console.error("Error fetching forex rates:", error);
    return {};
  }
}
