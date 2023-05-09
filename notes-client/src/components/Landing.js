import { useEffect, useState } from "react";
import {
  AppShell,
  Navbar,
  Header,
  Burger,
  useMantineTheme,
  Group,
  createStyles,
  Image,
  Transition,
  Autocomplete,
  ScrollArea,
  Modal,
  TextInput,
  Button,
} from "@mantine/core";
import Head from "./Head";
import Editor from "./Editor";

import Sidebar from "./Sidebar";
import { IconLockOpen, IconSearch } from "@tabler/icons";
import {
  fetchNotes,
  getNotesDecrypted,
  getNotesKey,
  setDecryptionKey,
} from "../features/notes/notesSlice";
import { useDispatch, useSelector } from "react-redux";
import { useDisclosure } from "@mantine/hooks";

const useStyles = createStyles((theme) => ({
  inner: {
    height: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    marginLeft: `calc(${theme.spacing.md} * -1)`,
    marginRight: `calc(${theme.spacing.md} * -1)`,
    marginBottom: theme.spacing.md,

    "&:not(:last-of-type)": {
      borderBottom: `${1} solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[3]
      }`,
    },
  },
}));

export default function Landing() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(true);
  const [selected, setSelected] = useState(0);
  const { classes } = useStyles();
  const decrypted = useSelector(getNotesDecrypted);
  const key = useSelector(getNotesKey);
  const [modalOpened, { open, close }] = useDisclosure(false);
  const dispatch = useDispatch();

  const onSelectChange = (index) => {
    setSelected(index);
  };

  useEffect(() => {
    if (decrypted === false) {
      open();
    }
  }, [key]);

  useEffect(() => {
    dispatch(fetchNotes(key));
  }, []);

  const onPasswordSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchNotes(key));
    close();
  };

  return (
    <AppShell
      styles={{
        main: {
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint={opened ? "xs" : "5000"}
      asideOffsetBreakpoint="xs"
      navbar={
        <Transition
          mounted={opened}
          transition="slide-right"
          duration={200}
          timingFunction="ease"
        >
          {(styles) => (
            <Navbar
              p="md"
              hiddenBreakpoint="5000"
              hidden={!opened}
              width={{ sm: 250, lg: 350 }}
              style={{
                ...styles,
              }}
            >
              <Navbar.Section>
                <Autocomplete
                  placeholder="Search"
                  icon={<IconSearch size="1rem" stroke={1.5} />}
                  data={[
                    "React",
                    "Angular",
                    "Vue",
                    "Next.js",
                    "Riot.js",
                    "Svelte",
                    "Blitz.js",
                  ]}
                />
              </Navbar.Section>
              <Navbar.Section
                grow
                mt="md"
                className={classes.section}
                component={ScrollArea}
              >
                <Sidebar onSelectChange={onSelectChange} selected={selected} />
              </Navbar.Section>
            </Navbar>
          )}
        </Transition>
      }
      header={
        <Header height={{ base: 60, md: 60 }} p="md">
          <div className={classes.inner}>
            <Group>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size="sm"
                color={theme.colors.gray[6]}
              />

              <Image src="logo.svg" maw={150} />
            </Group>
            <Head />
          </div>
        </Header>
      }
    >
      {decrypted ? <Editor selected={selected} /> : <></>}
      <Modal
        opened={modalOpened}
        title="Enter your password"
        size={"sm"}
        withCloseButton={false}
        centered
      >
        <TextInput
          placeholder="Password"
          value={key}
          onChange={(e) => dispatch(setDecryptionKey(e.target.value))}
        />
        <Button
          fullWidth
          mt={"md"}
          leftIcon={<IconLockOpen size="1rem" />}
          onClick={onPasswordSubmit}
          type="submit"
        >
          Unlock Notes
        </Button>
      </Modal>
    </AppShell>
  );
}
