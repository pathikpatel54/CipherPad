import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import notesReducer from "../features/notes/notesSlice";

export const store = configureStore({
    reducer: {
        notes: notesReducer,
        auth: authReducer,
    },
});
