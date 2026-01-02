import { Box } from "@mui/material";
import { useEffect, useState } from "react";

const FetchJson = () => {

    const [data, setData] = useState([])

    const getData = async () => {
        try {
            let res = await fetch("http://localhost:5000/posts");

            // 1. Check if the request was successful
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            // 2. FIX: Use .json() to asynchronously parse the body
            let result = await res.json();

            console.log(result);
            setData(result);

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        getData()

    }, [])
    return (
        <>
            <Box>
                <h1>this is fetch</h1>
                <ul>
                    {data && data.map((d) => {
                        <li key={d.id}>
                            {d}
                        </li>
                    })}
                </ul>


            </Box>
        </>
    )
}
export default FetchJson;