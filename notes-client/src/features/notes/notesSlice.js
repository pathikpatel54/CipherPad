import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { decryptData, encryptData } from "../../middlewares/crypto";

const initialState = {
    notes: [],
    status: "idle",
    error: "",
    decrypted: false,
    synced: true,
    key: "",
};

export const fetchNotes = createAsyncThunk(
    "notes/fetchNotes",
    async (password) => {
        const response = await axios.get("/api/notes");
        if (password !== "") {
            const decrypted = await decryptNotes(response.data, password);
            return decrypted;
        }
        return response.data;
    }
);

export const addNote = createAsyncThunk(
    "notes/addNote",
    async (request, password) => {
        const encryptedRequest = {
            ...request,
            content: await encryptData(request.content, password),
            title: await encryptData(request.title, password),
        };
        const response = (await axios.post("/api/note", encryptedRequest)).data;
        const decryptedResponse = {
            ...response,
            content: await decryptData(response.content, password),
            title: await decryptData(response.title, password),
        };
        return decryptedResponse;
    }
);

export const deleteNote = createAsyncThunk("notes/deleteNote", async (id) => {
    const response = await axios.delete(`/api/note/${id}`);
    return response.data;
});

const updateNote = (state, action) => {
    const { selected, content } = action.payload;
    if (state.notes[selected] != null) {
        state.notes[selected] = content;
    }
};

const setKey = (state, action) => {
    const password = action.payload;
    state.key = password;
};

const decryptNotes = async (notes, password) => {
    return Promise.all(
        notes.map(async (note) => {
            return {
                ...note,
                content: await decryptData(note.content, password),
                title: await decryptData(note.title, password),
            };
        })
    );
};

const notesSlice = createSlice({
    name: "notes",
    initialState,
    reducers: {
        updateNote,
        setKey,
    },
    extraReducers(builder) {
        builder
            .addCase(fetchNotes.pending, (state) => {
                state.status = "pending";
            })
            .addCase(fetchNotes.fulfilled, (state, action) => {
                if (action.payload[0].content === "Error") {
                    state.decrypted = false;
                    state.key = "";
                    state.status = "fulfilled";
                } else {
                    state.status = "fulfilled";
                    state.notes = action.payload;
                    if (state.key !== "") {
                        state.decrypted = true;
                    }
                }
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.status = "rejected";
                state.error = action.error.message;
            })
            .addCase(addNote.pending, (state) => {
                state.status = "pending";
            })
            .addCase(addNote.fulfilled, (state, action) => {
                state.status = "fulfilled";
                state.notes.push(action.payload);
            })
            .addCase(addNote.rejected, (state, action) => {
                state.status = "rejected";
                state.error = action.error.message;
            })
            .addCase(deleteNote.pending, (state) => {
                state.status = "pending";
            })
            .addCase(deleteNote.fulfilled, (state, action) => {
                state.status = "fulfilled";
                state.notes = state.notes.filter(
                    (note) => note.id !== action.payload
                );
            })
            .addCase(deleteNote.rejected, (state, action) => {
                state.status = "rejected";
                state.error = action.error.message;
            });
    },
});

export const selectAllNotes = (state) => state.notes.notes;
export const getNotesKey = (state) => state.notes.key;
export const getNotesStatus = (state) => state.notes.status;
export const getNotesError = (state) => state.notes.error;
export const getNotesDecrypted = (state) => state.notes.decrypted;
export const syncNote = notesSlice.actions.updateNote;
export const setDecryptionKey = notesSlice.actions.setKey;

export default notesSlice.reducer;
