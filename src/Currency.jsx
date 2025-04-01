import { useEffect, useState } from "react"; import { fetchForexRates, convertCurrency, currencySymbols } from "./Forex";

export default function CurrencyConverter() { const [rates, setRates] = useState({}); const [amount, setAmount] = useState(1); const [fromCurrency, setFromCurrency] = useState("USD"); const [toCurrency, setToCurrency] = useState("EUR"); const [convertedAmount, setConvertedAmount] = useState(0);

useEffect(() => { fetchForexRates().then(setRates); }, []);

useEffect(() => { if (rates[fromCurrency] && rates[toCurrency]) { setConvertedAmount(convertCurrency(amount, rates[fromCurrency], rates[toCurrency])); } }, [amount, fromCurrency, toCurrency, rates]);

return ( <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 mt-10"> <h2 className="text-2xl font-bold text-center mb-4">Currency Converter</h2> <div className="space-y-4"> <input type="number" className="w-full p-2 border rounded-md" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" />

<div className="flex items-center space-x-2">
      <select 
        className="w-full p-2 border rounded-md" 
        value={fromCurrency} 
        onChange={(e) => setFromCurrency(e.target.value)}
      >
        {Object.keys(rates).map((code) => (
          <option key={code} value={code}>
            {currencySymbols[code] || ""} {code}
          </option>
        ))}
      </select>
      <span className="text-xl">➡</span>
      <select 
        className="w-full p-2 border rounded-md" 
        value={toCurrency} 
        onChange={(e) => setToCurrency(e.target.value)}
      >
        {Object.keys(rates).map((code) => (
          <option key={code} value={code}>
            {currencySymbols[code] || ""} {code}
          </option>
        ))}
      </select>
    </div>

    <div className="text-center bg-blue-500 text-white p-3 rounded-md text-lg font-semibold">
      {currencySymbols[toCurrency] || ""} {convertedAmount.toFixed(2)} {toCurrency}
    </div>
  </div>
</div>

); }

