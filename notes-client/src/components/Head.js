import {
  Group,
  createStyles,
  Button,
  Modal,
  Stack,
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Text,
} from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import {
  getAuthError,
  getAuthStatus,
  postLogin,
  postSignUp,
  selectAllAuth,
} from "../features/auth/authSlice";
import UserMenu from "./UserMenu";
import { upperFirst, useDisclosure, useToggle } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import React, { useImperativeHandle, forwardRef, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

const useStyles = createStyles((theme) => ({
  links: {
    [theme.fn.smallerThan("md")]: {
      display: "none",
    },
  },

  search: {
    [theme.fn.smallerThan("xs")]: {
      display: "none",
    },
  },
}));
const Head = forwardRef((props, ref) => {
  const { classes, theme } = useStyles();
  const dispatch = useDispatch();
  const auth = useSelector(selectAllAuth);
  const authStatus = useSelector(getAuthStatus);
  const authError = useSelector(getAuthError);

  const [opened, { open, close }] = useDisclosure(false);

  useImperativeHandle(ref, () => ({
    open: () => onSignUp(),
  }));

  const [type, toggle] = useToggle(["login", "register"]);
  const form = useForm({
    initialValues: {
      email: "",
      name: "",
      password: "",
      terms: true,
      remember: true,
    },

    validate: {
      name: (val) => (val ? null : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) =>
        val.length <= 6
          ? "Password should include at least 6 characters"
          : null,
      terms: (val) => (val ? null : "Accept terms and conditions"),
      remember: (val) => (val ? null : null),
    },
  });

  const onFormSubmit = (values) => {
    if (type === "register") {
      dispatch(postSignUp(values));
    } else {
      dispatch(postLogin(values));
    }
  };

  const onLogin = () => {
    toggle("login");
    open();
  };

  const onSignUp = () => {
    toggle("register");
    open();
  };

  useEffect(() => {
    if (authStatus === "pending") {
      notifications.clean();
      notifications.show({
        id: "load-user",
        loading: true,
        title: "Authenticating",
        message: "Please wait while you are being authenticated",
        autoClose: false,
        withCloseButton: false,
      });
    } else if (authStatus === "fulfilled") {
      notifications.update({
        id: "load-user",
        color: "teal",
        title: "Authentication successfull",
        message: "Authentication is successfull, you are being redirected",
        icon: <IconCheck size="1rem" />,
        autoClose: 2000,
      });
      form.reset();
      close();
    } else if (authStatus === "rejected") {
      notifications.update({
        id: "load-user",
        color: "red",
        title: "Authentication failed",
        message: "Authentication has failed, please try again",
        icon: <IconCheck size="1rem" />,
        autoClose: 2000,
      });
    }
  }, [authStatus]);

  const renderSignIn = () => {
    return auth._id ? (
      <>
        <UserMenu email={auth.email} name={auth.name} image={auth.picture} />
      </>
    ) : (
      <Group>
        <Button variant="default" onClick={onLogin}>
          Log in
        </Button>
        <Button onClick={onSignUp}>Sign up</Button>
      </Group>
    );
  };

  return (
    <Group>
      <Group ml={50} spacing={5} className={classes.links}></Group>
      <Modal
        opened={opened}
        onClose={() => {
          form.reset();
          close();
        }}
        title={
          <Text size="lg" weight={600}>
            {" "}
            {type === "login" ? "Login" : "Register"}{" "}
          </Text>
        }
        shadow="xl"
        overlayProps={{
          color:
            theme.colorScheme === "dark"
              ? theme.colors.dark[9]
              : theme.colors.gray[2],
          opacity: 0.8,
          blur: 5,
        }}
      >
        <form onSubmit={form.onSubmit(onFormSubmit)}>
          <Stack>
            {type === "register" && (
              <TextInput
                label="Name"
                placeholder="Your name"
                value={form.values.name}
                onChange={(event) =>
                  form.setFieldValue("name", event.currentTarget.value)
                }
                required={type === "register" ? true : false}
                error={form.errors.name && "Invalid Name"}
              />
            )}

            <TextInput
              required
              label="Email"
              placeholder="Your Email"
              value={form.values.email}
              onChange={(event) =>
                form.setFieldValue("email", event.currentTarget.value)
              }
              error={form.errors.email && "Invalid email"}
            />

            <PasswordInput
              required
              label="Password"
              placeholder="Your password"
              value={form.values.password}
              onChange={(event) =>
                form.setFieldValue("password", event.currentTarget.value)
              }
              error={
                form.errors.password &&
                "Password should include at least 6 characters"
              }
            />
            <Checkbox
              label="Remember me"
              checked={form.values.remember}
              onChange={(event) =>
                form.setFieldValue("remember", event.currentTarget.checked)
              }
              error={form.errors.remember && "Accept terms and conditions."}
            />

            {type === "register" && (
              <Checkbox
                label="I accept terms and conditions"
                checked={form.values.terms}
                onChange={(event) =>
                  form.setFieldValue("terms", event.currentTarget.checked)
                }
                error={form.errors.terms && "Accept terms and conditions."}
              />
            )}
          </Stack>

          <Group position="apart" mt="xl">
            <Anchor
              component="button"
              type="button"
              color="dimmed"
              onClick={() => {
                form.reset();
                toggle();
              }}
              size="xs"
            >
              {type === "register"
                ? "Already have an account? Login"
                : "Don't have an account? Register"}
            </Anchor>
            <Button type="submit">{upperFirst(type)}</Button>
          </Group>
        </form>
      </Modal>
      {renderSignIn()}
    </Group>
  );
});

export default Head;
