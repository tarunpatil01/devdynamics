import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async () => {
  const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
  const res = await fetch(`${baseURL}/expenses`);
  const data = await res.json();
  return data.data;
});

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchExpenses.pending, state => { state.status = 'loading'; })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default expensesSlice.reducer;
