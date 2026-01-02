import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Chip,
} from '@mui/material';
import useBrowserStore from '../store/browserStore';

function EventLogger() {
    const [loading, setLoading] = useState(true);
    const { capturedEvents, setCaptureEvents, url, setSteps, cases, caseIdCounter } = useBrowserStore();

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.source === window && event.data.source === 'my-extension-relay') {
                console.log(event);
                const newEvent = {...event.data.payload, id: Date.now()};
                setCaptureEvents(newEvent);
                setSteps(newEvent);
                setLoading(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [url]);


    // return (
    //     <Box sx={{ maxHeight: '90vh', overflowY: 'auto', px: 1}}>
    //         <Typography variant="h4" component="h1" gutterBottom color='#fff'>
    //             Recorded Events
    //         </Typography>
    //         {loading ? (
    //             <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, alignItems: 'center' }}>
    //                 <CircularProgress color='warning' />
    //                 <Typography variant="body1" sx={{ ml: 2, color: '#fff' }}>
    //                     Waiting for events to capture...
    //                 </Typography>
    //             </Box>
    //         ) : (
    //             <List sx={{ color: '#fff' }}>
    //                 {capturedEvents.map((event, index) => (
    //                     <ListItem key={index} disablePadding>
    //                         {testData(event) && <ListItemText
    //                             primary={`Step ${index + 1} ${event.message} ${handleName(event)}`}
    //                         />}
    //                     </ListItem>
    //                 ))}
    //             </List>
    //         )}
    //     </Box>

    // );
}

export default EventLogger;