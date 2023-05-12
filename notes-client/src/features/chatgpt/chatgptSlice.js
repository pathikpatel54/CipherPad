import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  assistant: {},
  status: "idle",
  error: "",
};

export const requestPrompt = createAsyncThunk(
  "chatgpt/requestPrompt",
  async (prompt) => {
    const response = await axios.post("/api/chatgpt", prompt);
    return response.data;
  }
);

const chatgptSlice = createSlice({
  name: "chatgpt",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(requestPrompt.pending, (state) => {
        state.status = "pending";
        state.assistant = {};
        state.error = "";
      })
      .addCase(requestPrompt.fulfilled, (state, action) => {
        if (action.payload.error) {
          state.status = "rejected";
          state.assistant = {};
          state.error = action.payload.error.message;
        } else {
          state.status = "fulfilled";
          state.assistant = action.payload;
          state.error = "";
        }
      })
      .addCase(requestPrompt.rejected, (state, action) => {
        state.status = "rejected";
        state.assistant = {};
        state.error = action.error.message;
      });
  },
});

export const selectAllAssistant = (state) => state.chatgpt.assistant;
export const getChatgptStatus = (state) => state.chatgpt.status;
export const getChatgptError = (state) => state.chatgpt.error;

export default chatgptSlice.reducer;
