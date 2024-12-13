const axios = require("axios");
const crypto = require("crypto");
const WebSocket = require("ws");

const BASE_URL =
  "https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api/";

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function connectAliceBlue({ userId, apiKey }) {
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // Ensures cookies are sent if required
  });

  try {
    // Step 1: Get Encrypted Key
    const encKeyResponse = await axiosInstance.post(
      "https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api/customer/getAPIEncpkey",
      {
        userId: "488059",
      }
    );
    const encKey = encKeyResponse.data.encKey;
    //console.log("enc key :- ", encKey);
    if (!encKey) throw new Error("Failed to retrieve encrypted key.");

    // Step 2: Get Session ID
    const concatKey = `${userId}${apiKey}${encKey}`;
    const hashData = hash(concatKey);
    const sessionResponse = await axiosInstance.post(
      "https://ant.aliceblueonline.com/rest/AliceBlueAPIService/api/customer/getUserSID",
      {
        userId,
        userData: hashData,
      }
    );
    
    const sessionID = sessionResponse.data.sessionID;

    if (!sessionID) throw new Error("Failed to retrieve session ID.");

    // Step 3: Construct Bearer Token
    const bearerToken = `Bearer ${userId} ${sessionID}`;
    //console.log("bearer token : - ", bearerToken);

    // Step 4: Create WebSocket Session
    const wsSessionResponse = await axiosInstance.post(
      "ws/createWsSession",
      { loginType: "API" },
      { headers: { Authorization: bearerToken } }
    );
    const wsSession = wsSessionResponse.data.result.wsSess;
    if (!wsSession) throw new Error("Failed to create WebSocket session.");

    console.log("WebSocket session created:", wsSession);

    // Step 5: WebSocket Communication
    const ws = new WebSocket("wss://ws2.aliceblueonline.com/NorenWS/", {
      headers: { Authorization: bearerToken },
    });

    const authPayload = {
      susertoken: hash(hash(sessionID)),
      t: "c",
      actid: `${userId}_API`,
      uid: `${userId}_API`,
      source: "API",
    };

    ws.on("open", () => {
      console.log("WebSocket connection established.");

      // Send authentication payload
      ws.send(JSON.stringify(authPayload));
      console.log("Authentication payload sent:", authPayload);

      // Subscribe to market data (example payload)
      const marketDataPayload = { k: "NFO|54957", t: "d" };
      console.log(marketDataPayload);
      ws.send(JSON.stringify(marketDataPayload));
      console.log("Market data subscription payload sent:", marketDataPayload);
    });

    ws.on("message", (message) => {
      const response = JSON.parse(message);
      console.log("Response from server:", response);

      if (response.t === "cf" && response.k === "OK") {
        console.log("Connection validated successfully.");
      } else if (response.t === "cf" && response.k === "failed") {
        console.error("Connection validation failed.");
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error.message);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed.");
    });

    return { success: true, sessionID, wsSession };
  } catch (error) {
    console.error("Error in Alice Blue connection:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { connectAliceBlue };
