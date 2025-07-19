import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchBalances = createAsyncThunk('balances/fetchBalances', async (_, { rejectWithValue }) => {
  try {
    const token = sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
    const res = await fetch(`${baseURL}/balances`, { headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return rejectWithValue(errorData.message || 'Failed to fetch balances');
    }
    const data = await res.json();
    return data.data || {};
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const balancesSlice = createSlice({
  name: 'balances',
  initialState: { items: {}, status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchBalances.pending, state => { state.status = 'loading'; })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
        state.items = {};
      });
  },
});

export default balancesSlice.reducer;
