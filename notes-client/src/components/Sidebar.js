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
import {
  IconNote,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addNote,
  deleteNote,
  getNotesDecrypted,
  selectAllNotes,
} from "../features/notes/notesSlice";
import { getEncryptionKey } from "../features/auth/authSlice";
import { IconFolderFilled } from "@tabler/icons-react";
import { useEffect, useState } from "react";

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

const Sidebar = ({ onSelectChange, selected }) => {
  const { classes, cx } = useStyles();
  const folders = useSelector(selectAllNotes);
  const dispatch = useDispatch();
  const key = useSelector(getEncryptionKey);
  const decrypted = useSelector(getNotesDecrypted);
  const [modalOpen, setModalOpen] = useState(false);
  const [newNoteData, setNewNoteData] = useState({ title: "", folder: "" });
  const foldersWithNotes = folders.filter((folder) => folder.notes.length > 0);
  const onCreateNew = (e) => {
    setModalOpen(true);
  };

  const generateFolderData = () => {
    return foldersWithNotes.map((folder) => ({
      value: folder.name,
      label: folder.name,
    }));
  };

  const handleCreateNote = () => {
    const newNote = {
      content: "",
      title: newNoteData.title,
      datecreated: new Date().toISOString(),
      folder: newNoteData.folder,
    };
    dispatch(addNote({ newNote, key }));
    setModalOpen(false);
    setNewNoteData({ title: "", folder: "" });
  };

  useEffect(() => {
    if (folders.length > 0 && folders[0].notes.length > 0) {
      onSelectChange(folders[0].notes[0]?.id);
    }
  }, [folders]);

  const onDeleteClick = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNote(id));
    if (folders.length > 0 && folders[0].notes.length > 0) {
      onSelectChange(folders[0].notes[0]?.id);
    }
  };

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
      {[...foldersWithNotes]
        .sort((a, b) => (a.name === "root" ? 1 : -1))
        .map((folder) =>
          folder.name === "root" ? (
            folder.notes.map(renderNote)
          ) : (
            <Accordion variant="default" radius="xs" key={folder.name}>
              <Accordion.Item value={folder.name}>
                <Accordion.Control icon={<IconFolderFilled />}>
                  {folder.name}
                </Accordion.Control>
                <Accordion.Panel pr={0}>
                  {decrypted ? folder.notes.map(renderNote) : ""}
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          )
        )}

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
            required
            fullWidth
          />
          <Autocomplete
            dropdownPosition="bottom"
            label="Folder"
            placeholder="Enter folder name"
            data={generateFolderData()}
            value={newNoteData.folder}
            onChange={(value) =>
              setNewNoteData({ ...newNoteData, folder: value })
            }
            required
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
