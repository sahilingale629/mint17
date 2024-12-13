// src/components/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import "./Login.css"; // Import the CSS file for styling

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const navigate = useNavigate(); // Create navigate function

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Set loading to true when starting the login request
    setMessage(""); // Clear any previous messages

    const data = { username, password };

    try {
      const response = await fetch("http://localhost:5007/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json(); // Parse the JSON response

      if (response.ok && responseData.message === "Login successful") {
        setMessage("Login successful!");
        console.log("Data sent successfully:", responseData);

        // Redirect to homepage upon successful login
        navigate("/homepage"); // Adjust the path based on your route configuration
      } else {
        setMessage(responseData.message || "Login failed. Please try again.");
        console.error("Failed to send data:", response.status);
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false); // Set loading to false after request completes
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Mint Master</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      {message && <p className="login-message">{message}</p>}
    </div>
  );
};

export default Login;
