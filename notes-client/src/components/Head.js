import {
    Group,
    createStyles,
    Button,
} from "@mantine/core";
import { IconBrandGoogle } from "@tabler/icons";
import { useSelector } from "react-redux";
import { selectAllAuth } from "../features/auth/authSlice";
import UserMenu from "./UserMenu";

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
const Head = () => {
    const { classes } = useStyles();

    const auth = useSelector(selectAllAuth);

    const renderSignIn = () => {
        return auth.id ? (
            <>
                
                <UserMenu
                    email={auth.email}
                    name={auth.name}
                    image={auth.picture}
                />
            </>
        ) : (
            <Button
                component="a"
                href="/auth/google"
                leftIcon={<IconBrandGoogle size={18} />}
            >
                Sign In with Google
            </Button>
        );
    };

    return (
        <Group>
            <Group ml={50} spacing={5} className={classes.links}></Group>

            {renderSignIn()}
        </Group>
    );
};

export default Head;
