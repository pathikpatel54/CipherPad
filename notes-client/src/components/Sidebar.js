import {
  ActionIcon,
  Box,
  createStyles,
  Divider,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useDispatch, useSelector } from "react-redux";
import {
  addNote,
  deleteNote,
  getNotesDecrypted,
  getNotesKey,
  selectAllNotes,
} from "../features/notes/notesSlice";
import { getEncryptionKey } from "../features/auth/authSlice";

const useStyles = createStyles((theme) => ({
  link: {
    ...theme.fn.focusStyles(),
    display: "block",
    textDecoration: "none",
    color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
    lineHeight: 1.2,
    fontSize: theme.fontSizes.sm,
    padding: theme.spacing.md,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderLeft: `${"2px"} solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,

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
  const notes = useSelector(selectAllNotes);
  const dispatch = useDispatch();
  const key = useSelector(getEncryptionKey);
  const decrypted = useSelector(getNotesDecrypted);

  console.log(decrypted);
  const onCreateNew = (e) => {
    console.log("This");
    onSelectChange(notes.length);
    const newNote = {
      content: "",
      title: "",
      datecreated: new Date().toISOString(),
    };
    dispatch(addNote({ newNote, key }));
  };

  const onDeleteClick = (e, id) => {
    onSelectChange(0);
    e.stopPropagation();
    dispatch(deleteNote(id));
  };

  const links = notes?.map((note, index) => (
    <Box
      component="a"
      href={"#"}
      onClick={(event) => {
        event.preventDefault();
        onSelectChange(index);
      }}
      key={note?.id}
      className={cx(classes.link, {
        [classes.linkActive]: selected === index,
      })}
      sx={(theme) => ({
        paddingLeft: theme.spacing.md,
        display: "flex",
        justifyContent: "space-between",
      })}
    >
      {note?.title === "" ? "Untitled Note" : note?.title}
      {/* <IconDatabase size="1rem" /> */}
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
  ));

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
      <Divider my="xs" variant="solid" />
      <div className={classes.collections}>{decrypted ? links : ""}</div>
    </>
  );
};

export default Sidebar;
