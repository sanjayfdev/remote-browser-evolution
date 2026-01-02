import {
    Box,
    Grid,
    Paper,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import { useRef} from "react";
import useBrowserStore from "../store/browserStore";
import { Close } from "@mui/icons-material";

const Screen2 = ({ size }) => {
    const { activeTab, setActiveTab, url, cases, deleteCases } = useBrowserStore();
    const iframeRef = useRef(null);


    return (
        <Grid
            size={size}
            sx={{
                height: "100vh",
                width: "100%",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box"
            }}
        >
            {/* <Paper sx={{ display: "flex", alignItems: "center" }}>
                <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} variant="scrollable" scrollButtons="auto" data-ignore-capture="true">
                    {cases.map((tab) => (
                        <Tab
                            key={tab.id}
                            value={tab.id}
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Typography variant="body2" noWrap>
                                        {tab.baseUrl ? new URL(tab.baseUrl).hostname : "New Tab"}
                                    </Typography>
                                    <Box
                                        component="span"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteCases(tab.id);
                                        }}
                                    >
                                        <Close fontSize="small" />
                                    </Box>
                                </Box>
                            }
                        />
                    ))}
                </Tabs>
            </Paper> */}
            {/* {cases.length > 0 ? cases.map((c) => (
                <Box key={c.id} sx={{ height: "100%", overflowY: 'hidden', display: activeTab === c.id ? 'block' : 'none' }}>
                    <iframe
                        ref={iframeRef}
                        src={c.baseUrl}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                        }}
                        sandbox="allow-same-origin 
                        allow-scripts 
                        allow-forms 
                        allow-popups 
                        allow-presentation 
                        allow-modals"
                        title={`tab-${url}`}
                    />
                </Box>
            ))
                :
                null
            } */}

            <Box sx={{ height: "100%", width: "100%"}}>
                    <iframe
                        // ref={iframeRef}
                        src={url}
                        style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                        }}
                        sandbox="allow-same-origin 
                        allow-scripts 
                        allow-forms 
                        allow-popups 
                        allow-presentation 
                        allow-modals"
                        title={`tab-${url}`}
                    />
                </Box>
        </Grid>
    );
};

export default Screen2;
