const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Serve a simple HTML form
app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Python Function Interface</h1>
        <form action="/process" method="POST">
          <label for="input">Enter Text:</label><br>
          <input type="text" id="input" name="input"><br><br>
          <button type="submit">Submit</button>
        </form>
        <div id="output"></div>
      </body>
    </html>
  `);
});

// Handle form submissions
app.post("/process", (req, res) => {
  const userInput = req.body.input;

  // Call the Python script with the input
  const pythonProcess = spawn("python", ["TrainPinecone.py", userInput]);

  let pythonOutput = "";
  pythonProcess.stdout.on("data", (data) => {
    pythonOutput += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`Python error: ${data.toString()}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.send(`
        <html>
          <body>
            <h1>Python Function Interface</h1>
            <form action="/process" method="POST">
              <label for="input">Enter Text:</label><br>
              <input type="text" id="input" name="input"><br><br>
              <button type="submit">Submit</button>
            </form>
            <div id="output">
              <h2>Output:</h2>
              <p>${pythonOutput}</p>
            </div>
          </body>
        </html>
      `);
    } else {
      res.status(500).send("Error processing request.");
    }
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
