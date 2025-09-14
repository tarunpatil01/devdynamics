import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../utils/apiBase';

export const fetchBalances = createAsyncThunk('balances/fetchBalances', async (groupId, { rejectWithValue }) => {
  try {
    // Validate groupId (avoid hitting backend with empty ?group= which causes 400)
    const isValidGroup = typeof groupId === 'string' && groupId.trim() !== '' && /^[0-9a-fA-F]{24}$/.test(groupId.trim());
    if (!isValidGroup) {
      // Silently return empty balances instead of erroring – UI will show empty state
      return {};
    }
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_BASE}/balances?group=${groupId}`, { headers });
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
