import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { decryptData, encryptData } from "../../middlewares/crypto";
import { NodeType } from "@tiptap/pm/model";

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
  async ({ newNote: request, key: password }) => {
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
  const folderName = content.folder;
  // Find the FolderNotes with the given folderName
  const folderNotes = state.notes.find((folder) => folder.name === folderName);

  if (folderNotes) {
    // Find the index of the note with the given selected ID
    const noteIndex = folderNotes.notes.findIndex(
      (note) => note.id === selected
    );
    if (noteIndex !== -1) {
      // Update the note content
      folderNotes.notes[noteIndex] = content;
    }
  }
};

const decryptNotes = async (folderNotesList, password) => {
  return Promise.all(
    folderNotesList.map(async (folderNotes) => {
      const decryptedNotes = await Promise.all(
        folderNotes.notes.map(async (note) => {
          return {
            ...note,
            content: await decryptData(note.content, password),
            title: await decryptData(note.title, password),
          };
        })
      );
      return {
        ...folderNotes,
        notes: decryptedNotes,
      };
    })
  );
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    updateNote,
  },
  extraReducers(builder) {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = "fetching";
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        if (action.payload[0]?.content === "Error") {
          state.decrypted = false;
          state.status = "fetched";
          alert(action.payload[0]?.content);
        } else {
          state.status = "fetched";
          state.notes = action.payload;
          state.decrypted = true;
        }
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = "fetchRejected";
        state.error = action.error.message;
      })
      .addCase(addNote.pending, (state) => {
        state.status = "adding";
      })
      .addCase(addNote.fulfilled, (state, action) => {
        state.status = "added";
        const folderNotes = state.notes.find(
          (folder) => folder.name === action.payload.folder
        );
        if (folderNotes) {
          // Existing folder, just push the new note
          folderNotes.notes.push(action.payload);
        } else {
          // New folder, create a new folder with the new note
          state.notes.push({
            name: action.payload.folder,
            notes: [action.payload],
          });
        }
      })
      .addCase(addNote.rejected, (state, action) => {
        state.status = "addRejected";
        state.error = action.error.message;
      })
      .addCase(deleteNote.pending, (state) => {
        state.status = "deleting";
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        state.status = "deleted";
        state.notes.forEach((folderNotes) => {
          folderNotes.notes = folderNotes.notes.filter(
            (note) => note.id !== action.payload
          );
        });
      })
      .addCase(deleteNote.rejected, (state, action) => {
        state.status = "deleteRejected";
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
