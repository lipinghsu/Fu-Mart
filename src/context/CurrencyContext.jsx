import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState(
    () => localStorage.getItem("preferredCurrency") || "USD"
  );
  const [exchangeRates, setExchangeRates] = useState({ USD: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Fetch function
  const fetchRates = async () => {
    try {
      setIsLoading(true);
      console.log("🌍 [Currency] Fetching rates from open.er-api.com...");
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await response.json();

      if (data?.result === "success" && data?.rates) {
        const rates = { USD: 1, ...data.rates };

        // ✅ Explicit log for TWD rate
        console.log("✅ [Currency] API returned TWD rate:", rates.TWD);
        console.log("✅ [Currency] Available keys:", Object.keys(rates).slice(0, 20), "...");

        setExchangeRates(rates);
        localStorage.setItem("exchangeRates", JSON.stringify(rates));
        localStorage.setItem("exchangeRatesTimestamp", Date.now().toString());
      } else {
        throw new Error("Invalid response from exchange rate API");
      }
    } catch (err) {
      console.error("❌ [Currency] Fetch failed:", err);
      const cached = localStorage.getItem("exchangeRates");
      if (cached) {
        console.log("💾 [Currency] Loaded cached rates from localStorage.");
        setExchangeRates(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🕒 Initial load + caching
  useEffect(() => {
    const cachedRates = localStorage.getItem("exchangeRates");
    const lastFetch = localStorage.getItem("exchangeRatesTimestamp");
    const ONE_HOUR = 60 * 60 * 1000;

    // ⚠️ If cache exists but doesn’t include TWD, ignore it
    if (cachedRates) {
      const parsed = JSON.parse(cachedRates);
      if (!parsed.TWD) {
        console.warn("⚠️ [Currency] Cached rates missing TWD — refetching fresh data...");
        localStorage.removeItem("exchangeRates");
        localStorage.removeItem("exchangeRatesTimestamp");
        fetchRates();
        return;
      }
    }

    if (cachedRates && lastFetch && Date.now() - parseInt(lastFetch) < ONE_HOUR) {
      console.log("🕒 [Currency] Using cached rates (fresh).");
      setExchangeRates(JSON.parse(cachedRates));
      setIsLoading(false);
    } else {
      fetchRates();
    }
  }, []);

  // 🔹 Normalize NTD → TWD
  const normalizedCode = selectedCurrency === "NTD" ? "TWD" : selectedCurrency;

  const rate =
    exchangeRates[normalizedCode] ??
    exchangeRates["TWD"] ??
    1;

  // 💬 Debug logs for clarity
  useEffect(() => {
    console.log("💰 [Currency] Selected:", selectedCurrency);
    console.log("💰 [Currency] Normalized:", normalizedCode);
    console.log("💰 [Currency] Applied Rate:", rate);
  }, [selectedCurrency, rate]);

  // 💵 Conversion helpers
  const convertPrice = (usdPrice) => usdPrice * rate;

  const formatPrice = (usdPrice) => {
    if (isLoading) return "...";
    const converted = convertPrice(usdPrice);
    const symbolMap = {
      USD: "$",
      TWD: "NT$",
      JPY: "¥",
      KRW: "₩",
    };
    const symbol = symbolMap[normalizedCode] || "$";

    if (["TWD", "JPY", "KRW"].includes(normalizedCode)) {
      return `${symbol}${Math.ceil(converted).toLocaleString()}`;
    }

    return `${symbol}${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Save preference
  useEffect(() => {
    localStorage.setItem("preferredCurrency", selectedCurrency);
  }, [selectedCurrency]);

  const handleSetCurrency = (code) => {
    const normalized = code === "NTD" ? "TWD" : code;
    setSelectedCurrency(normalized);
    localStorage.setItem("preferredCurrency", normalized);
  };

  return (
    <CurrencyContext.Provider
      value={{
        selectedCurrency: normalizedCode,
        setSelectedCurrency: handleSetCurrency,
        formatPrice,
        isLoading,
        rate,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
