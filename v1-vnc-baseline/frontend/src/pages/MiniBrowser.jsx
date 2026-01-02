import { Grid } from "@mui/material";
import Screen2 from "../components/Screen2";
import Screen1 from "../components/Screen1";

const MiniBrowser = () => {
  return (
    <Grid
      container
      sx={{ height: "100vh", width: "100vw", flexWrap: "nowrap" }}
    >
      <Screen1 size="auto" />

      <Screen2 size='grow' />
    </Grid>
  );
};

export default MiniBrowser;
