const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const { parse } = require("json2csv");
const path = require("path");

// AES GCM Decryption Class
class TBSAlgoEncryptDecrypt {
  static ALGORITHM = "aes-256-gcm";
  static GCM_IV_LENGTH = 12;
  static GCM_TAG_LENGTH = 16;

  static gcmDecrypt(encryptedData, secretKey) {
    const encryptedBuffer = Buffer.from(encryptedData, "base64");

    const iv = encryptedBuffer.slice(0, this.GCM_IV_LENGTH);
    const ciphertext = encryptedBuffer.slice(
      this.GCM_IV_LENGTH,
      encryptedBuffer.length - this.GCM_TAG_LENGTH
    );
    const authTag = encryptedBuffer.slice(
      encryptedBuffer.length - this.GCM_TAG_LENGTH
    );

    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      Buffer.from(secretKey, "base64"),
      iv
    );
    decipher.setAuthTag(authTag);

    try {
      let decrypted = decipher.update(ciphertext, null, "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error.message);
      throw error;
    }
  }
}

// URLs for requests
const urlLogin =
  "https://uat-api-algo.tradebulls.in/ms-algo-trading-authservice/login";
const urlSendOtp =
  "https://uat-api-algo.tradebulls.in/ms-algo-trading-authservice/sendOtp";
const urlLogin2faTotp =
  "https://uat-api-algo.tradebulls.in/ms-algo-trading-authservice/login2faTotp";
const urlCustomerProfile =
  "https://uat-api-algo.tradebulls.in/ms-trading-customer-profile/loggedinuser/profiledetails";
const urlsMasters = {
  EQ: "https://uat-api-algo.tradebulls.in/ms-trading-masters-loader/masters/EQ",
  FNO: "https://uat-api-algo.tradebulls.in/ms-trading-masters-loader/masters/FNO",
  CURR: "https://uat-api-algo.tradebulls.in/ms-trading-masters-loader/masters/CURR",
  COMM: "https://uat-api-algo.tradebulls.in/ms-trading-masters-loader/masters/COMM",
};

// Headers
const headers = {
  "request-info":
    '{"rit":"123","cver":"1.0v","ch":"WEB","info":{},"reqts":"12345678","payload":[]}',
  "x-api-key": "E6J9HA1BA31EJK90IK12KL80BBRRN590",
  "Content-Type": "application/json",
};

// Secret key
const secretKey = "id+qipZHEPff/jNJPlyjKObYKcM+JWqzYFGGGzJh+mc=";

// Variables for tokens
let loginToken = null;
let otpToken = null;

// Step 1: Login
const login = async (username, password) => {
  try {
    console.log("Starting Login...");

    const response = await axios.post(
      urlLogin,
      {
        username: username,
        password: password,
        clientId: "tbsenterpriseweb",
        appId: "1",
        vendorName: "MintMaster",
        state: "Mint",
      },
      { headers }
    );

    if (response.status === 200) {
      loginToken = response.data?.data?.success?.logintoken;
      if (loginToken) {
        console.log("Login Token:", loginToken);
        await sendOtp();
        return { status: "success", data: { loginToken } };
      } else {
        console.error("Login token not found.");
        return { status: "failed", message: "Login token not found." };
      }
    } else {
      console.error("Login failed with status:", response.status);
      return { status: "failed", message: "Login failed." };
    }
  } catch (error) {
    console.error("Login error:", error.message);
    return { status: "failed", message: error.message };
  }
};

// Step 2: Send OTP
const sendOtp = async () => {
  try {
    console.log("Sending OTP...");
    const response = await axios.post(
      urlSendOtp,
      {
        payload: [{ logintoken: loginToken, product: "OTP2FA" }],
      },
      { headers }
    );

    if (response.status === 200) {
      otpToken = response.data?.data?.success?.otpToken;
      if (otpToken) {
        console.log("OTP Token:", otpToken);
        const otpCode = 123456; // Replace with dynamic input if needed
        await verifyTotp(otpCode);
      } else {
        console.error("OTP token not found.");
      }
    } else {
      console.error("OTP request failed with status:", response.status);
    }
  } catch (error) {
    console.error("Error sending OTP:", error.message);
  }
};

// Step 3: Verify TOTP
const verifyTotp = async (otpCode) => {
  try {
    console.log("Verifying TOTP...");
    const response = await axios.post(
      urlLogin2faTotp,
      {
        payload: [{ logintoken: loginToken, otp: otpCode, authFlag: "0" }],
      },
      { headers }
    );

    if (response.status === 200) {
      const encryptedAccessToken = response.data?.data?.success?.access_token;
      if (encryptedAccessToken) {
        const decryptedAccessToken = TBSAlgoEncryptDecrypt.gcmDecrypt(
          encryptedAccessToken,
          secretKey
        );
        console.log("Decrypted Access Token:", decryptedAccessToken);
        headers.Authorization = `Bearer ${decryptedAccessToken}`;
        await getCustomerProfile();
      } else {
        console.error("Access token not found.");
      }
    } else {
      console.error("TOTP verification failed with status:", response.status);
    }
  } catch (error) {
    console.error("Error verifying TOTP:", error.message);
  }
};

// Step 4: Get Customer Profile
const getCustomerProfile = async () => {
  try {
    console.log("Fetching Customer Profile...");
    const response = await axios.get(urlCustomerProfile, { headers });

    if (response.status === 200) {
      console.log("Customer Profile:", response.data?.data?.success);
      await fetchMastersData("EQ");
    } else {
      console.error("Failed to fetch profile.");
    }
  } catch (error) {
    console.error("Error fetching profile:", error.message);
  }
};

// Step 5–8: Fetch Masters Data
const fetchMastersData = async (type) => {
  try {
    console.log(`Fetching Masters Data for ${type}...`);
    const response = await axios.get(urlsMasters[type], { headers });

    if (response.status === 200) {
      const data = response.data?.data?.success;
      if (data) {
        const csv = parse(data);
        fs.writeFileSync(`${type.toLowerCase()}_output.csv`, csv);
        console.log(`${type} Data saved to ${type.toLowerCase()}_output.csv`);

        // Proceed to next type
        const nextType =
          type === "EQ"
            ? "FNO"
            : type === "FNO"
            ? "CURR"
            : type === "CURR"
            ? "COMM"
            : null;
        if (nextType) await fetchMastersData(nextType);
        else {
          // Once all data is fetched, merge the CSV files
          await mergeCSVFiles();
        }
      } else {
        console.error(`${type} Data not found.`);
      }
    } else {
      console.error(`Failed to fetch ${type} data.`);
    }
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error.message);
  }
};

// Step 9: Merge CSV Files
const mergeCSVFiles = async () => {
  try {
    const filePaths = [
      path.join(__dirname, "eq_output.csv"),
      path.join(__dirname, "fno_output.csv"),
      path.join(__dirname, "curr_output.csv"),
      path.join(__dirname, "comm_output.csv"),
    ];

    const allData = [];

    // Read and merge the CSV content
    for (let filePath of filePaths) {
      const fileData = fs.readFileSync(filePath, "utf8");
      const parsedData = fileData.split("\n").map((line) => line.split(","));
      if (allData.length === 0) {
        allData.push(parsedData[0]); // Add the header
      }
      allData.push(...parsedData.slice(1)); // Add the rows
    }

    // Convert merged data back to CSV format
    const mergedCsv = parse(allData);
    fs.writeFileSync("merged_output.csv", mergedCsv);
    console.log("Merged CSV saved to merged_output.csv");
  } catch (error) {
    console.error("Error merging CSV files:", error.message);
  }
};

// Export functions for use in other files
module.exports = {
  login,
  sendOtp,
  verifyTotp,
  getCustomerProfile,
  fetchMastersData,
  mergeCSVFiles,
};
