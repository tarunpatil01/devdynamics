import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE } from '../utils/apiBase';
import authFetch from '../utils/authFetch';

export const fetchSettlements = createAsyncThunk('settlements/fetchSettlements', async (groupId, { rejectWithValue }) => {
  try {
    const isValidGroup = typeof groupId === 'string' && groupId.trim() !== '' && /^[0-9a-fA-F]{24}$/.test(groupId.trim());
    if (!isValidGroup) {
      return [];
    }
    const res = await authFetch(`/settlements?group=${groupId}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return rejectWithValue(errorData.message || 'Failed to fetch settlements');
    }
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const settlementsSlice = createSlice({
  name: 'settlements',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSettlements.pending, state => { state.status = 'loading'; })
      .addCase(fetchSettlements.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSettlements.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error.message;
        state.items = [];
      });
  },
});

export default settlementsSlice.reducer;
