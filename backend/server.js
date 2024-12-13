// server.js
const express = require("express");
const cors = require("cors");
const { login } = require("./logic"); // Import the login function from logic.js
const { connectAliceBlue } = require("./aliceBlueConnector");
const path = require("path"); // Import the path module
const Papa = require("papaparse");
const fs = require("fs"); // Import the fs module
const { SmartAPI, WebSocketV2 } = require("smartapi-javascript");
const WebSocket = require("ws");
const axios = require("axios");

const app = express();
const port = 5007;

const wss = new WebSocket.Server({ port: 8080 }, () => {
  console.log("WebSocket server running on ws://localhost:8080");
});

// CORS configuration to allow specific origins
app.use(cors());
app.use(express.json());

function broadcastToClients(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("Frontend connected via WebSocket");

  ws.on("close", () => {
    console.log("Frontend WebSocket connection closed");
  });
});

// POST route to handle login data
app.post("/api/data", async (req, res) => {
  const { username, password } = req.body;

  // Check if both username and password are provided
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    console.log("Received data from frontend:", { username, password });

    // Call the login function from logic.js and pass username & password
    const loginResponse = await login(username, password);

    // Check if login was successful
    if (loginResponse.status === "success") {
      // Send success response with the login data
      res.status(200).json({
        message: "Login successful",
        data: loginResponse.data,
      });
    } else {
      // Send unsuccessful login response
      res.status(401).json({
        message: loginResponse.message || "Login unsuccessful",
      });
    }
  } catch (error) {
    // Handle errors from login process
    res.status(500).json({
      message: "An error occurred during login",
      error: error.message,
    });
  }
});

app.get("/save-csv", async (req, res) => {
  const url =
    "https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json";
  const filePath = path.join(__dirname, "OpenAPIScripMaster.csv");

  try {
    console.log("Fetching JSON data...");
    const response = await axios.get(url);

    // Ensure the response contains valid data
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Invalid JSON data fetched from the URL.");
    }

    console.log("Converting JSON to CSV...");
    // Convert JSON to CSV
    const csv = Papa.unparse(response.data);

    // Save the CSV file
    fs.writeFileSync(filePath, csv, "utf8");
    console.log(`CSV saved successfully at: ${filePath}`);

    res.status(200).send("CSV saved successfully in proper format!");
  } catch (error) {
    console.error("Error fetching or saving the CSV:", error.message);
    res.status(500).send("Failed to save CSV file.");
  }
});

app.post("/connect-aliceblue", async (req, res) => {
  // //const { userId, apiKey } = req.body; // Get data from frontend
  // const userId = "488059";
  // const apiKey =
  //   "FTlDyv5M6j931VGZ6elvlU7HgWYkWy5IWrFeyAAF15QULcYIgsPS8Cyli4lFW481DF6sfDy7zkfNXQ6XFclL0RkuTIJeFRK566xOZM3qcQRhvIyn3AFiTrhIhdy883by";
  // try {
  //   const result = await connectAliceBlue({ userId, apiKey });
  //   if (result.success) {
  //     res.status(200).json({ success: true, data: result });
  //   } else {
  //     res.status(500).json({ success: false, error: result.error });
  //   }
  // } catch (error) {
  //   res.status(500).json({ success: false, error: error.message });
  // }
  // let web_socket = new WebSocketV2({
  //   jwttoken:
  //   "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlM0OTIzNzIiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJMFpESmxaRGd4WWkxaVlqZGxMVE14TTJZdFlUbGhOeTAyTkRJeU9UUXpabVE1TlRRaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqRWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlgwc0ltbHpjeUk2SW5SeVlXUmxYMnh2WjJsdVgzTmxjblpwWTJVaUxDSnpkV0lpT2lKVE5Ea3lNemN5SWl3aVpYaHdJam94TnpNek9UQTVNakUwTENKdVltWWlPakUzTXpNNE1qSTJNelFzSW1saGRDSTZNVGN6TXpneU1qWXpOQ3dpYW5ScElqb2lOVGxqWkdabE9EWXRNR00wWlMwMFpEY3pMV0UwTVRRdE1UWmtOVFF3TkdObFlUa3pJaXdpVkc5clpXNGlPaUlpZlEuZjgtWmtWTl85aTFPcEhERGFQWno4RHdxemZMWU9lSFFSU1VLN0lfVjhjZlFBd2FEOHJmUTY2Um5XZXQ4UEpZSmg5c3NoOFFrNTNhM3VFeXlDMlhhNEY3WmZDMUkyNDhyV2I3cGZJRS1pQlIyaS0yYWJOZGhsOU85Zi1NUjVTZXlvVk40TVppY1kxcmY2amw2NUZVT1hmQnJ0azNHZjF6MFgxWFRzN25jN2hjIiwiQVBJLUtFWSI6Ing2Q0FJeDJSIiwiaWF0IjoxNzMzODIyODE0LCJleHAiOjE3MzM5MDkyMTR9.sM5boAfN83sRkslGyOYJPaXrcZ_JzNMm5VlUpKnAzbtw5Ct06vTbY50jYllmh4yZB7oTW94cTpreVsZomw-ADg",
  //   apikey: "x6CAIx2R ",
  //   clientcode: "S492372",
  //   feedtype:
  //     "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlM0OTIzNzIiLCJpYXQiOjE3MzM4MjI4MTQsImV4cCI6MTczMzkwOTIxNH0.qTjFbpITPCIxrgf4kyYTpUsvxXqIUDGMncqF407yI480ajcsTMbEr9a92ZWyXGZltljidsijzrwvruuT1xK3kw",
  // });
  // // for mode, action and exchangeTypes , can use values from constants file.
  // web_socket.connect().then((res) => {
  //   let json_req = {
  //     correlationID: "correlation_id",
  //     action: 1,
  //     mode: 1,
  //     exchangeType: 1,
  //     tokens: ["17818"],
  //   };
  //   web_socket.fetchData(json_req);
  //   web_socket.on("tick", receiveTick);
  //   function receiveTick(data) {
  //     if (data && data.last_traded_price) {
  //       data.last_traded_price = data.last_traded_price / 100;
  //     }
  //     console.log("receiveTick:::::", data);
  //   }
  // });
  try {
    // Replace these values with actual credentials
    const web_socket = new WebSocketV2({
      jwttoken:
        "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlM0OTIzNzIiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJMFpESmxaRGd4WWkxaVlqZGxMVE14TTJZdFlUbGhOeTAyTkRJeU9UUXpabVE1TlRRaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqRWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlgwc0ltbHpjeUk2SW5SeVlXUmxYMnh2WjJsdVgzTmxjblpwWTJVaUxDSnpkV0lpT2lKVE5Ea3lNemN5SWl3aVpYaHdJam94TnpNek9UQTVNakUwTENKdVltWWlPakUzTXpNNE1qSTJNelFzSW1saGRDSTZNVGN6TXpneU1qWXpOQ3dpYW5ScElqb2lOVGxqWkdabE9EWXRNR00wWlMwMFpEY3pMV0UwTVRRdE1UWmtOVFF3TkdObFlUa3pJaXdpVkc5clpXNGlPaUlpZlEuZjgtWmtWTl85aTFPcEhERGFQWno4RHdxemZMWU9lSFFSU1VLN0lfVjhjZlFBd2FEOHJmUTY2Um5XZXQ4UEpZSmg5c3NoOFFrNTNhM3VFeXlDMlhhNEY3WmZDMUkyNDhyV2I3cGZJRS1pQlIyaS0yYWJOZGhsOU85Zi1NUjVTZXlvVk40TVppY1kxcmY2amw2NUZVT1hmQnJ0azNHZjF6MFgxWFRzN25jN2hjIiwiQVBJLUtFWSI6Ing2Q0FJeDJSIiwiaWF0IjoxNzMzODIyODE0LCJleHAiOjE3MzM5MDkyMTR9.sM5boAfN83sRkslGyOYJPaXrcZ_JzNMm5VlUpKnAzbtw5Ct06vTbY50jYllmh4yZB7oTW94cTpreVsZomw-ADg",
      apikey: "x6CAIx2R",
      clientcode: "S492372",
      feedtype:
        "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlM0OTIzNzIiLCJpYXQiOjE3MzQwNjU1MTQsImV4cCI6MTczNDE1MTkxNH0.Qhr1uw9t5s8XSl3c645EMfhNyn92-7p85mLkzT-9MVkI4GcGi82JWtJC3pen8UyPS5JaOXiCqZ3jlwNeHwp5eQ",
    });

    await web_socket.connect();
    console.log("Connected to AliceBlue WebSocket");

    const json_req = {
      correlationID: "correlation_id",
      action: 1,
      mode: 1,
      exchangeType: 1,
      tokens: ["17818"], // Token ID for fetching data
    };

    web_socket.fetchData(json_req);
    web_socket.on("tick", (data) => {
      if (data && data.last_traded_price) {
        data.last_traded_price = data.last_traded_price / 100;

        console.log("Last Traded Price:", data.last_traded_price);

        // Broadcast the price to all connected WebSocket clients
        broadcastToClients(
          JSON.stringify({ lastTradedPrice: data.last_traded_price })
        );
      }
    });

    res.status(200).json({ message: "Connected to AliceBlue WebSocket" });
  } catch (error) {
    console.error("Error connecting to AliceBlue WebSocket:", error.message);
    res.status(500).json({ error: "Failed to connect to AliceBlue WebSocket" });
  }
});

app.post("/login-all-clients", async (req, res) => {
  const filePath = path.join(__dirname, "clients.csv"); // Path to the CSV file

  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Parse the CSV content
    const parsedData = Papa.parse(fileContent, {
      header: true, // Read the CSV header
      skipEmptyLines: true, // Ignore empty lines
    });

    // Check for parsing errors
    if (parsedData.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsedData.errors[0].message}`);
    }

    const clients = parsedData.data; // Array of client objects from CSV

    // Simulate login for each client
    const loginResults = await Promise.all(
      clients.map(async (client) => {
        const { username, password } = client;

        try {
          // Call the login function
          const loginResponse = await login(username, password);

          // Check if login was successful
          if (loginResponse.status === "success") {
            return {
              username,
              status: "Success",
              data: loginResponse.data,
            };
          } else {
            return {
              username,
              status: "Failed",
              message: loginResponse.message || "Login unsuccessful",
            };
          }
        } catch (error) {
          return {
            username,
            status: "Error",
            message: error.message,
          };
        }
      })
    );

    // Respond with the login results
    res.status(200).json({ success: true, clients: loginResults });
  } catch (error) {
    console.error("Error logging in clients:", error.message);
    res.status(500).json({ success: false, error: "Failed to log in clients" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
