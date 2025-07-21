import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSettlements = createAsyncThunk('settlements/fetchSettlements', async (groupId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const baseURL = import.meta.env.VITE_API_URL || 'https://devdynamics-yw9g.onrender.com';
    const groupParam = groupId ? `?group=${groupId}` : '';
    const res = await fetch(`${baseURL}/settlements${groupParam}`, { headers });
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
