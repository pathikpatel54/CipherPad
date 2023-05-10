import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  user: {},
  status: "idle",
  error: "",
  encryptionKey: "",
};

export const postLogin = createAsyncThunk("auth/postLogin", async (user) => {
  const response = await axios.post("/api/login", user);
  return { data: response.data, encryptionKey: user.password };
});

export const postSignUp = createAsyncThunk("auth/postSignUp", async (user) => {
  const response = await axios.post("/api/signup", user);
  return { data: response.data, encryptionKey: user.password };
});

export const fetchAuth = createAsyncThunk("auth/fetchAuth", async () => {
  const response = await axios.get("/api/user");
  return { data: response.data };
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchAuth.pending, (state) => {
        state.status = "fetching";
        state.error = "";
      })
      .addCase(fetchAuth.fulfilled, (state, action) => {
        state.status = "fetched";
        state.user = action.payload.data;
        const key = localStorage.getItem("key");
        state.encryptionKey = key;
        state.error = "";
      })
      .addCase(fetchAuth.rejected, (state, action) => {
        state.status = "fetcherror";
        state.error = action.error.message;
        state.encryptionKey = "";
      })
      .addCase(postLogin.pending, (state) => {
        state.status = "pending";
        state.error = "";
      })
      .addCase(postLogin.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.user = action.payload.data;
        state.encryptionKey = action.payload.encryptionKey;
        localStorage.setItem("key", action.payload.encryptionKey);
        state.error = "";
      })
      .addCase(postLogin.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      .addCase(postSignUp.pending, (state) => {
        state.status = "pending";
        state.error = "";
      })
      .addCase(postSignUp.fulfilled, (state, action) => {
        state.status = "fulfilled";
        state.user = action.payload.data;
        state.encryptionKey = action.payload.encryptionKey;
        localStorage.setItem("key", action.payload.encryptionKey);
        state.error = "";
      })
      .addCase(postSignUp.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });
  },
});

export const selectAllAuth = (state) => state.auth.user;
export const getAuthStatus = (state) => state.auth.status;
export const getAuthError = (state) => state.auth.error;
export const getEncryptionKey = (state) => state.auth.encryptionKey;

export default authSlice.reducer;
