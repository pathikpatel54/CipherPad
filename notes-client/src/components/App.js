import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuth, selectAllAuth } from "../features/auth/authSlice";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import Home from "./Home";
import Landing from "./Landing";
import { Notifications } from "@mantine/notifications";

const App = () => {
  const dispatch = useDispatch();
  const auth = useSelector(selectAllAuth);

  useEffect(() => {
    dispatch(fetchAuth());
  }, []);

  return (
    <>
      <MantineProvider
        theme={{
          colorScheme: "dark",
          defaultRadius: "xs",
        }}
        withGlobalStyles
        withNormalizeCSS
      >
        <Notifications position="bottom-center" />
        <div id="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={auth._id ? <Landing /> : <Home />} />
            </Routes>
          </BrowserRouter>
        </div>
      </MantineProvider>
    </>
  );
};

export default App;
