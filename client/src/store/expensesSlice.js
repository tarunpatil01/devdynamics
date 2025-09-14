import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../utils/apiBase';

export const fetchExpenses = createAsyncThunk('expenses/fetchExpenses', async () => {
  const token = localStorage.getItem('token');
  const baseURL = API_BASE;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${baseURL}/expenses`, { headers });
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
