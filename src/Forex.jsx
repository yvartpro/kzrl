import { useState, useEffect } from "react";

// All currencies information
export const initialRates = [
  { code: "USD", name: "US Dollar", rate: 1, symbol: "$", type: "fiat" },
  { code: "EUR", name: "Euro", rate: 0.93, symbol: "€", type: "fiat" },
  { code: "GBP", name: "British Pound", rate: 0.79, symbol: "£", type: "fiat" },
  { code: "JPY", name: "Japanese Yen", rate: 149.27, symbol: "¥", type: "fiat" },
  { code: "AUD", name: "Australian Dollar", rate: 1.53, symbol: "A$", type: "fiat" },
  { code: "CAD", name: "Canadian Dollar", rate: 1.37, symbol: "C$", type: "fiat" },
  { code: "CNY", name: "Chinese Yuan", rate: 7.23, symbol: "¥", type: "fiat" },
  { code: "INR", name: "Indian Rupee", rate: 83.42, symbol: "₹", type: "fiat" },
  { code: "NGN", name: "Nigerian Naira", rate: 1530.51, symbol: "₦", type: "fiat" },
  { code: "ZAR", name: "South African Rand", rate: 18.56, symbol: "R", type: "fiat" },
  { code: "KES", name: "Kenyan Shilling", rate: 132.75, symbol: "KSh", type: "fiat" },
  { code: "EGP", name: "Egyptian Pound", rate: 48.66, symbol: "E£", type: "fiat" },
  { code: "ETB", name: "Ethiopian Birr", rate: 56.83, symbol: "Br", type: "fiat" },
  { code: "GHS", name: "Ghanaian Cedi", rate: 14.86, symbol: "GH₵", type: "fiat" },

  // Cryptocurrencies
  { code: "BTC", name: "Bitcoin", rate: 0.000016, symbol: "₿", type: "crypto" },
  { code: "ETH", name: "Ethereum", rate: 0.00027, symbol: "Ξ", type: "crypto" },
  { code: "BNB", name: "Binance Coin", rate: 0.0027, symbol: "BNB", type: "crypto" },
  { code: "SOL", name: "Solana", rate: 0.0076, symbol: "SOL", type: "crypto" },
  { code: "ADA", name: "Cardano", rate: 0.22, symbol: "ADA", type: "crypto" },
  { code: "XRP", name: "Ripple", rate: 1.72, symbol: "XRP", type: "crypto" },
  { code: "DOT", name: "Polkadot", rate: 0.148, symbol: "DOT", type: "crypto" },
  { code: "DOGE", name: "Dogecoin", rate: 7.36, symbol: "DOGE", type: "crypto" },
];

// Currency symbols map
export const currencySymbols = Object.fromEntries(
  initialRates.map(({ code, symbol }) => [code, symbol])
);

// const [currencyRates, setCurrencyRates] = useState(initialRates || []);


export function fetchForexRates() {
  // Simulate fetching new forex rates, this could be replaced with an actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const updatedRates = initialRates.reduce((acc, { code, rate }) => {
        acc[code] = rate * (Math.random() + 0.5); // Modify rate with some variation
        return acc;
      }, {});
      resolve(updatedRates);
    }, 2000);
  });
}

// export function convertCurrency(amount, fromCurrency, toCurrency, currencyRates) {
//   const ratesArray = Object.values(currencyRates);
//   const fromRate = ratesArray.find((rate) => rate.code === fromCurrency)?.rate;
//   const toRate = ratesArray.find((rate) => rate.code === toCurrency)?.rate;

//   if (fromRate && toRate) {
//     return (amount / fromRate) * toRate;
//   }
//   return null; // Return null if rates not found
// }

export function convertCurrency(amount, fromCurrency, toCurrency, rates) {
  console.log("Rates received in convertCurrency:", rates);
  
  if (!rates[fromCurrency]) {
    console.error(`Missing rate for fromCurrency: ${fromCurrency}`);
    return null;
  }

  if (!rates[toCurrency]) {
    console.error(`Missing rate for toCurrency: ${toCurrency}`);
    return null;
  }

  const result = (amount * rates[toCurrency]) / rates[fromCurrency];
  console.log(`Converted ${amount} ${fromCurrency} to ${result} ${toCurrency}`);
  
  return result;
}


export default function Forex() {
  const [currencyRates, setCurrencyRates] = useState(initialRates);
  const [lastRatesUpdate, setLastRatesUpdate] = useState(new Date().toISOString());

  useEffect(() => {
    async function updateRates() {
      const rates = await fetchForexRates();
      const updatedRates = currencyRates.map((c) => ({
        ...c,
        rate: rates[c.code] || c.rate, // Update rates if available, otherwise keep default
      }));
      setCurrencyRates(updatedRates);
      setLastRatesUpdate(new Date().toISOString());
    }

    updateRates().catch(console.error);
  }, []);

  return (
    <div>
      <h2>Forex & Crypto Exchange Rates</h2>
      <p>Last Updated: {new Date(lastRatesUpdate).toLocaleString()}</p>
      <ul>
        {currencyRates.map(({ code, name, rate, symbol, type }) => (
          <li key={code}>
            {name} ({code}): {symbol} {type === "crypto" ? rate.toFixed(6) : rate.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
