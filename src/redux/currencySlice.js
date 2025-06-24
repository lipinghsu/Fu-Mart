import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedCurrency: 'USD',
  exchangeRates: {
    USD: 1,
    EUR: 0.93,
    JPY: 157.68,
    KRW: 1370,
    TWD: 32.5
  }
};

const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setCurrency(state, action) {
      state.selectedCurrency = action.payload;
    },
    setExchangeRates(state, action) {
      state.exchangeRates = action.payload;
    }
  }
});

export const { setCurrency, setExchangeRates } = currencySlice.actions;

export default currencySlice.reducer;
