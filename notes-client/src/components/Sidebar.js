import {
  Accordion,
  ActionIcon,
  Autocomplete,
  Box,
  Button,
  createStyles,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconNote, IconPlus, IconTrash } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addNote,
  deleteNote,
  getNotesDecrypted,
  getNotesError,
  getNotesStatus,
  selectAllNotes,
} from "../features/notes/notesSlice";
import { getEncryptionKey } from "../features/auth/authSlice";
import { IconFolderFilled } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { notifications } from "@mantine/notifications";

const useStyles = createStyles((theme) => ({
  link: {
    ...theme.fn.focusStyles(),
    display: "block",
    textDecoration: "none",
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
    lineHeight: 1.2,
    fontSize: theme.fontSizes.sm,
    padding: theme.spacing.sm,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },
  },

  linkActive: {
    fontWeight: 500,
    borderLeftColor:
      theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 6 : 7],
    color:
      theme.colors[theme.primaryColor][theme.colorScheme === "dark" ? 2 : 7],

    "&, &:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.fn.rgba(theme.colors[theme.primaryColor][9], 0.25)
          : theme.colors[theme.primaryColor][0],
    },
  },

  collectionsHeader: {
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    marginBottom: 5,
  },
}));

const Sidebar = ({ onSelectChange, selected, searchInput }) => {
  const { classes, cx } = useStyles();
  const folders = useSelector(selectAllNotes);
  const notesStatus = useSelector(getNotesStatus);
  const notesError = useSelector(getNotesError);
  const dispatch = useDispatch();
  const key = useSelector(getEncryptionKey);
  const decrypted = useSelector(getNotesDecrypted);
  const [modalOpen, setModalOpen] = useState(false);
  const [newNoteData, setNewNoteData] = useState({ title: "", folder: "" });
  const [selectedFolder, setSelectedFolder] = useState([]);

  const filteredFolders = useMemo(() => {
    return folders
      .map((folder) => ({
        ...folder,
        notes: folder.notes.filter(
          (note) =>
            note.title.toLowerCase().includes(searchInput.toLowerCase()) ||
            note.content.toLowerCase().includes(searchInput.toLowerCase())
        ),
      }))
      .filter((folder) => folder.notes.length > 0);
  }, [folders, searchInput]);

  const onCreateNew = (e) => {
    setModalOpen(true);
  };

  const generateFolderData = () => {
    return filteredFolders.map((folder) => ({
      value: folder.name,
      label: folder.name,
    }));
  };

  const handleCreateNote = async () => {
    const newNote = {
      content: "",
      title: newNoteData.title,
      datecreated: new Date().toISOString(),
      folder: newNoteData.folder,
    };
    const addedNoteAction = await dispatch(addNote({ newNote, key }));
    const addedNote = addedNoteAction.payload;
    setModalOpen(false);
    setNewNoteData({ title: "", folder: "" });

    // Automatically select the newly created note
    onSelectChange(addedNote.id);

    // Expand the folder accordion if the new note is inside a folder
    if (newNote.folder !== "root") {
      setSelectedFolder((prevFolders) => [...prevFolders, newNote.folder]);
    }
  };

  const onDeleteClick = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNote(id));

    // Get the folder of the note being deleted
    const folderOfDeletedNote = folders.find((folder) =>
      folder.notes.some((note) => note.id === id)
    );

    // If there are other notes in the same folder, select the first one
    if (folderOfDeletedNote && folderOfDeletedNote.notes.length > 1) {
      const remainingNote = folderOfDeletedNote.notes.find(
        (note) => note.id !== id
      );
      onSelectChange(remainingNote?.id);
    } else {
      // If no other notes in the same folder, select the first note in the root folder
      const rootFolder = folders.find((folder) => folder.name === "root");
      if (rootFolder && rootFolder.notes.length > 0) {
        onSelectChange(rootFolder.notes[0]?.id);
      }
    }
  };

  useEffect(() => {
    // If no note is selected, select the first note in the root folder
    if (!selected) {
      const rootFolder = folders.find((folder) => folder.name === "root");
      if (rootFolder && rootFolder.notes.length > 0) {
        onSelectChange(rootFolder.notes[0]?.id);
      }
    }
  }, [folders, selected]);

  useEffect(() => {
    if (notesStatus === "fetching") {
      notifications.clean();
      notifications.show({
        id: "load-notes",
        loading: true,
        title: "Fetching Notes",
        message: "Please wait while we fetch your notes",
        autoClose: false,
        withCloseButton: false,
      });
    } else if (notesStatus === "fetched") {
      notifications.update({
        id: "load-notes",
        color: "teal",
        title: "Notes loaded successfully",
        message: "Your request was successfull.",
        icon: <IconCheck size="1rem" />,
        autoClose: 1000,
      });
    } else if (notesStatus === "fetchRejected") {
      notifications.update({
        id: "load-notes",
        color: "red",
        title: "Request failed",
        message: "Request has failed: " + notesError,
        icon: <IconCheck size="1rem" />,
        autoClose: 1000,
      });
    } else if (notesStatus === "adding") {
      notifications.clean();
      notifications.show({
        id: "load-notes",
        loading: true,
        title: "Creating New Note",
        message: "Please wait while we create new note",
        autoClose: false,
        withCloseButton: false,
      });
    } else if (notesStatus === "added") {
      notifications.update({
        id: "load-notes",
        color: "teal",
        title: "Note Created Successfully",
        message: "Your request was successfull, Note has been created.",
        icon: <IconCheck size="1rem" />,
        autoClose: 1000,
      });
    } else if (notesStatus === "addRejected") {
      notifications.update({
        id: "load-notes",
        color: "red",
        title: "Request failed",
        message: "Request has failed: " + notesError,
        icon: <IconCheck size="1rem" />,
        autoClose: 1000,
      });
    } else if (notesStatus === "deleting") {
      notifications.clean();
      notifications.show({
        id: "load-notes",
        loading: true,
        title: "Deleting Note",
        message: "Please wait while we delete the note",
        autoClose: false,
        withCloseButton: false,
      });
    } else if (notesStatus === "deleted") {
      notifications.update({
        id: "load-notes",
        color: "teal",
        title: "Note Deleted Successfully",
        message: "Your request was successfull, Note has been deleted.",
        icon: <IconCheck size="1rem" />,
        autoClose: 1000,
      });
    } else if (notesStatus === "deleteRejected") {
      notifications.update({
        id: "load-notes",
        color: "red",
        title: "Request failed",
        message: "Request has failed: " + notesError,
        icon: <IconCheck size="1rem" />,
        autoClose: 100,
      });
    }
  }, [notesStatus]);

  const renderNote = (note) => (
    <Box
      component="a"
      href="#"
      onClick={(event) => {
        event.preventDefault();
        onSelectChange(note?.id);
      }}
      key={note?.id}
      className={cx(classes.link, {
        [classes.linkActive]: selected === note.id,
      })}
      sx={(theme) =>
        note.folder === "root"
          ? {
              paddingLeft: "20px",
              paddingRight: "19px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }
          : {
              paddingLeft: "40px",
              paddingRight: "19px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }
      }
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <IconNote />
        <div
          style={{
            overflow: "hidden",
            maxWidth: "250px",
            marginLeft: "14px",
          }}
        >
          {note?.title === "" ? "Untitled Note" : note?.title}
        </div>
      </div>

      <Tooltip label="Delete Note" withArrow position="right">
        <ActionIcon
          variant="default"
          size={18}
          onClick={(e) => onDeleteClick(e, note?.id)}
        >
          <IconTrash size="0.8rem" stroke={1.5} />
        </ActionIcon>
      </Tooltip>
    </Box>
  );

  return (
    <>
      <Group className={classes.collectionsHeader} position="apart">
        <Text size="md" weight={500} color="dimmed">
          Notes
        </Text>
        <Tooltip
          label="Create new note"
          withArrow
          position="right"
          variant="subtle"
        >
          <ActionIcon variant="default" size={23} onClick={onCreateNew}>
            <IconPlus size="0.8rem" stroke={1.5} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Divider my="xs" variant="solid" style={{ marginBottom: "0px" }} />

      <Accordion
        variant="filled"
        radius="xs"
        multiple
        value={selectedFolder}
        onChange={setSelectedFolder}
      >
        {filteredFolders.map(
          (folder) =>
            folder.name !== "root" && (
              <Accordion.Item value={folder.name} key={folder.name}>
                <Accordion.Control icon={<IconFolderFilled />}>
                  {folder.name}
                </Accordion.Control>
                <Accordion.Panel pr={0}>
                  {decrypted ? folder.notes.map(renderNote) : ""}
                </Accordion.Panel>
              </Accordion.Item>
            )
        )}
      </Accordion>

      {filteredFolders
        .filter((folder) => folder.name === "root")
        .map((folder) => folder.notes.map(renderNote))}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create new note"
      >
        <Stack>
          <TextInput
            label="Title"
            placeholder="Enter note title"
            value={newNoteData.title}
            onChange={(event) =>
              setNewNoteData({ ...newNoteData, title: event.target.value })
            }
            fullWidth
          />
          <Autocomplete
            dropdownPosition="bottom"
            label="Folder"
            placeholder="Select existing folder or enter a new folder name"
            data={generateFolderData()}
            value={newNoteData.folder}
            onChange={(value) =>
              setNewNoteData({ ...newNoteData, folder: value })
            }
            fullWidth
            withinPortal
          />
          <Group position="center">
            <Button
              variant="outline"
              color="gray"
              onClick={() => setModalOpen(false)}
              style={{ marginRight: "10px" }}
            >
              Cancel
            </Button>
            <Button variant="filled" color="blue" onClick={handleCreateNote}>
              Create Note
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default Sidebar;
