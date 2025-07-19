import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from './expensesSlice';
import balancesReducer from './balancesSlice';
import settlementsReducer from './settlementsSlice';
import groupsReducer from './groupsSlice';

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
    balances: balancesReducer,
    settlements: settlementsReducer,
    groups: groupsReducer,
  },
});
