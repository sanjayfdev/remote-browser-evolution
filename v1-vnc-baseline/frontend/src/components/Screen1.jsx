import { Box, IconButton, Grid, Typography, TextField, Button, Paper, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import useBrowserStore from "../store/browserStore";
import { AddCircle, Delete, ExpandMore, ViewSidebar, RemoveCircle } from "@mui/icons-material";
import { useState } from "react";
import EventLogger from "./EventLogger";

let caseIdCounter = 0;

const Screen1 = ({ size }) => {
  const {
    setToggle,
    toggle,
    setUrl,
    url,
    capturedEvents,
    setCases,
    cases,
    deleteCases,
    addSteps,
    stepChange,
    deleteSteps } = useBrowserStore();
  const [activeTab, setActiveTab] = useState("cases")

  const submitForm = (e) => {
    e.preventDefault();
    const json = JSON.stringify(cases)
    console.log(json)
    postData(json);
    alert('submitted successfully')
  };

  const postData = async (data) => {
    try {
      const response = await fetch('http://localhost:5000/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to post data');
      }

    } catch (error) {
      console.error('Error:', error);
    }
  }


  const submitUrl = (e) => {
    e.preventDefault();
    const url = e.target[0].value;
    let formattedUrl = url;
    if (!/^https?:\/\//i.test(url)) formattedUrl = "https://" + url;
    setUrl(formattedUrl);
    setCases({
      id: caseIdCounter++,
      baseUrl: formattedUrl,
      steps: [{
        message: "Entered Url", name: formattedUrl, tag: "INPUT", value: url
      }]
    })
    e.target[0].value = "";
  }

  console.log(cases);
  console.log(capturedEvents);


  const eventCheck = (event) => {
    const { value, name, elementClass } = event;
    if ((value || name || elementClass)) return true;
    return false;
  }

  const handleName = (elementDetails) => {
    const { name, value, elementClass } = elementDetails;

    if (!name || !value || !elementClass) {
      return name || value || elementClass || "";
    }

    const nameCase = name.toLowerCase();
    const valueCase = value.toLowerCase();
    const singleSpacedValue = valueCase.replace(/\s+/g, ' ');

    
    if (nameCase.includes(valueCase) || valueCase.includes(nameCase)) {
      return name;
    } else {
      return name + " - " + singleSpacedValue;
    }
  }

  return (
    <Grid
      size={size}
      sx={{
        bgcolor: "#051335ff",
        height: "100%",
        width: toggle ? 400 : 100,
        flexShrink: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 2
      }}
    >
      <Box sx={{ px: 1 }} data-ignore-capture="true">
        <Box sx={{ display: "flex", justifyContent: toggle ? "space-between" : "center", alignItems: "center" }}>
          <Typography sx={{ color: "white", fontWeight: 700 }}>
            {toggle ? "logo" : null}
          </Typography>
          <IconButton onClick={setToggle} sx={{ color: "white" }}>
            <ViewSidebar fontSize="large" />
          </IconButton>
        </Box>
        <Box component={'form'} onSubmit={submitUrl} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

          <TextField
            fullWidth
            label="Enter URL"
            name={`URL ${url}`}
            size={'medium'}
            slotProps={{
              htmlInput: {
                'data-ignore-capture': 'true',
                id: 'secret-input'
              }
            }}
            sx={{
              "& .MuiInputBase-input": { color: "#ffffffff" },
              "& .MuiInputLabel-root": { color: "#ffffffff" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ffffffff" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "purple" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "red" },
              mb: 0
            }}
          />

          <Button
            variant="contained"
            type='submit'
            color="info"
            data-ignore-capture='true'
            sx={{
              height: '56px',
            }}
          >
            Go
          </Button>
        </Box>

        {/* <Box sx={{ display: toggle ? "flex" : 'none', gap: 1, justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Box sx={{ backgroundColor: '#1c1e2d', p: 0.7, borderRadius: 2, display: 'flex', gap: 1, width: '100%' }}>
            <Button
              disabled={activeTab === "cases"}
              variant="contained"
              sx={{
                color: '#fff',
                "&.Mui-disabled": {
                  color: "#fff",
                  backgroundColor: "#1c1e2d"
                },
              }}
              fullWidth
              onClick={() => { setActiveTab("cases") }}
            >Cases</Button>
            <Button
              fullWidth
              disabled={activeTab === "capture"}
              onClick={() => { setActiveTab("capture") }}
              variant="contained"
              sx={{
                color: '#fff',
                "&.Mui-disabled": {
                  color: "#fff",
                  backgroundColor: "#1c1e2d",
                }
              }}>Capture</Button>
          </Box>
        </Box> */}
      </Box>


      <Box component={'form'} onSubmit={submitForm} display={!toggle ? "none" : "flex"} flexDirection="column" gap={2} pl={1}>
        {/* Button to add a new case */}
        {/* <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={handleAddCase}
          sx={{ mx: 2 }}
        >
          Add New Case
        </Button> */}

        {/* Iterate Cases */}
        <Box sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {cases && cases.map((caseItem, index) => (
            <Box key={caseItem.id + index} sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <Paper sx={{ mb: 2, overflow: 'hidden', width: '100%' }} data-ignore-capture="true">
                <Accordion defaultExpanded={true} data-ignore-capture="true">
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls={`panel-${caseItem.id}-content`}
                    id={`panel-${caseItem.id}-header`}
                    data-ignore-capture="true"
                  >
                    <Typography>{new URL(caseItem.baseUrl).hostname}</Typography>
                  </AccordionSummary>
                  <AccordionDetails data-ignore-capture="true">
                    <Box sx={{ pl: 2, pt: 1, borderLeft: '2px solid #ddd', }}>

                      {/* Iterate Steps */}
                      {caseItem.steps.map((step, stepIndex) => (
                        <Box key={step.id + stepIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TextField
                            fullWidth
                            label={`Step ${stepIndex + 1}`}
                            name={`Step ${stepIndex + 1}`}
                            onBlur={(e) => stepChange(e, caseItem.id, step.id)}
                            multiline
                            defaultValue={eventCheck(step) ? `${step.message} ${handleName(step)}` : null}
                            slotProps={{
                              htmlInput: {
                                'data-ignore-capture': 'true',
                                id: 'secret-input'
                              }
                            }}
                            sx={{
                              "& .MuiInputBase-input": { color: "#000" },
                              "& .MuiInputLabel-root": { color: "#000" },
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#000" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "purple" },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "red" },
                            }}
                          />
                          <IconButton
                            onClick={() => deleteSteps(caseItem.id, step.id)}
                            color="error"
                            aria-label="remove step"
                            name={`remove step ${stepIndex + 1}`}
                            disabled={caseItem.steps.length === 1}
                            sx={{ ml: 1 }}
                          >
                            <RemoveCircle />
                          </IconButton>
                        </Box>
                      ))}

                      {/* Button to add a new step to the current case */}
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddCircle />}
                        onClick={() => addSteps(caseItem.id)}
                        sx={{ mt: 1 }}
                      >
                        Add Step
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Paper>
              <IconButton
                onClick={() => deleteCases(caseItem.id)}
                color="error"
                name="Remove Case"
                aria-label="remove case"
                disabled={cases.length === 1}
                sx={{ ml: 1, mt: 1 }}
              >
                <Delete />
              </IconButton>
            </Box>
          ))}

        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pr: 1 }}>
          <Button variant="contained">Save</Button>
          <Button variant="contained" color="success" type='submit'>Save & Submit</Button>
        </Box>
      </Box>

      <EventLogger />


    </Grid>
  );
};

export default Screen1;