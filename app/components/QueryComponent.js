import { useState } from "react";
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
  Paper,
} from "@mui/material";

const QueryComponent = () => {
  const [question, setQuestion] = useState("");
  const [responseText, setResponseText] = useState("");

  async function run() {
    try {
      const response = await fetch(`/api/GetPineconeData`, {
        method: "POST", // Make sure to use POST
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }), // Send the input question
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      paperPrompt.innerText = result.prompt;
      paperAnswer.innerText = result.answer;
    } catch (error) {
      console.error("Error fetching data:", error);
      setResponseText("An error occurred");
    }
  }

  return (
    <Container
      sx={{
        width: "100%",
        height: "100%",
      }}
    >
      <Box
        sx={{
          maxwidth: "sm",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" gutterBottom>
          HOD RAG
        </Typography>
        <Box
          sx={{
            width: "100%",
            height: "100vh",
            display: "grid",
            columnGap: 5,
            gridTemplateColumns: "repeat(2, 1fr)",
            overflowY: "auto", // Allow the whole page to scroll if needed
          }}
        >
          <Paper
            elevation={3}
            sx={{
              width: "100%",
              p: 2,
              mb: 2,
              flexGrow: 1,
              overflowY: "auto", // Allow content inside the Paper to scroll
              maxHeight: "100%", // Prevent it from exceeding the parent container's height
            }}
          >
            Prompt
            <Typography variant="body1" id="paperPrompt"></Typography>
          </Paper>
          <Paper
            elevation={3}
            sx={{
              width: "100%",
              p: 2,
              mb: 2,
              flexGrow: 1,
              overflowY: "auto", // Allow content inside the Paper to scroll
              maxHeight: "100%", // Prevent it from exceeding the parent container's height
            }}
          >
            Answer from GPT-4o
            <Typography variant="body1" id="paperAnswer"></Typography>
          </Paper>
        </Box>

        <TextField
          label="Type your question"
          multiline
          rows={4}
          fullWidth
          sx={{ label: { color: "black" }, input: { color: "black" } }}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={run}
          sx={{ mt: 2, mb: 10 }}
        >
          Send
        </Button>
      </Box>
    </Container>
  );
};

export default QueryComponent;
