import { Box, Button, Container, Tab, Tabs, Typography } from "@mui/material";
import React from "react";
import "./App.css";
import { useWallet } from "use-wallet";
import MintForm from "./forms/mint-form";

function App() {
  const [value, setValue] = React.useState(0);

  const wallet = useWallet();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
  }

  const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  const a11yProps = (index: number) => {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  };

  const ConnectWallet = () => {
    return (
      <Box style={{paddingTop: "10px", display: "flex", gap: "10px"}}>
        <Button variant="outlined" disabled={wallet.status === "connected"} onClick={() => wallet.connect('provided')}>
          {wallet.status === "connected"
            ? wallet?.account
            : "Click here to connect Wallet"}
        </Button>
        <Button variant="outlined" disabled={wallet.status !== "connected"} onClick={() => wallet.reset()}>
          Disconnect
        </Button>
      </Box>
    );
  };

  return (
    <Container maxWidth="md">
      <ConnectWallet />
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="Tabs">
          <Tab label="MINT" {...a11yProps(0)} />
          <Tab label="SELL" {...a11yProps(1)} />
          <Tab label="BUY" {...a11yProps(2)} />
          <Tab label="LOAN" {...a11yProps(3)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <MintForm />
      </TabPanel>
      <TabPanel value={value} index={1}>
        Item Two
      </TabPanel>
      <TabPanel value={value} index={2}>
        Item Three
      </TabPanel>
      <TabPanel value={value} index={2}>
        Item Four
      </TabPanel>
    </Container>
  );
}

export default App;
