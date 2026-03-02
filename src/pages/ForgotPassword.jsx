import "../styles/Sign_In.scss";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  isEmailAssociatedWithHoneycombAccount,
  sendPasswordResetEmail,
} from "../lib/authentication.js";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setHasError(true);
      setMessage("Email is required.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setHasError(false);

    try {
      const isKnownEmail = await isEmailAssociatedWithHoneycombAccount(normalizedEmail);
      if (!isKnownEmail) {
        setHasError(true);
        setMessage(
          "The Email you provided is not associated with an account, please provide a correct email",
        );
        return;
      }

      await sendPasswordResetEmail(normalizedEmail);
      setMessage("Reset instructions were sent to your email.");
    } catch (error) {
      setHasError(true);
      setMessage(error.message || "Unable to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="Sign_In_Style">
      <div className="container forgot-password-page">
        <div className="header">
          <div>
            <div className="text">Reset Password</div>
            <div className="subtitle">Enter your email and we will send reset instructions.</div>
          </div>
        </div>

        <div
          className="inputs"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isSubmitting) {
              handleSubmit(event);
            }
          }}
        >
          <div className="input_box">
            <p>Email</p>
            <div className="input">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {message ? (
          <div className={`auth-message ${hasError ? "auth-message-error" : "auth-message-success"}`}>
            {message}
          </div>
        ) : null}

        <div className="submit-container">
          <div
            className="submit"
            onClick={(event) => {
              if (!isSubmitting) {
                handleSubmit(event);
              }
            }}
            role="button"
            aria-disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait..." : "Send Reset Link"}
          </div>
        </div>

        <div className="page-change">
          <div className="Login">
            Back to{" "}
            <span
              onClick={() => {
                navigate("/Sign_In");
              }}
            >
              Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
