import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../utils/apiBase';
import authFetch from '../utils/authFetch';

export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async () => {
  const res = await authFetch('/expenses');
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
