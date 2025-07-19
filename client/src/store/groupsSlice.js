import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchGroups = createAsyncThunk('groups/fetchGroups', async (token) => {
  const res = await fetch('/groups', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data;
});

const groupsSlice = createSlice({
  name: 'groups',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchGroups.pending, state => { state.status = 'loading'; })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default groupsSlice.reducer;
