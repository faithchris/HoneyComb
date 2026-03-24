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
    <div className="Sign_In_Style Sign_In_Style--signup">
      <header className="sign-in-header">
        <div className="sign-in-header-inner">
          <span className="sign-in-header-spacer" aria-hidden="true" />
          <button
            type="button"
            className="sign-in-top-btn sign-in-top-btn--login"
            onClick={() => navigate("/Sign_In?mode=login")}
          >
            Log in
          </button>
        </div>
      </header>
      <div className="cloud cloud-1" aria-hidden="true" />
      <div className="cloud cloud-2" aria-hidden="true" />
      <div className="cloud cloud-3" aria-hidden="true" />

      <div className="container forgot-password-page">
        <div className="header">
          <div>
            <div className="text">honeycomb</div>
            <div className="subtitle-helper">A Focus Timer App</div>
            <div className="subtitle subtitle--context">Reset your password</div>
            <div className="subtitle-detail">
              Enter your email and we will send reset instructions.
            </div>
          </div>
        </div>

        <form
          className="inputs"
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isSubmitting) {
              handleSubmit(event);
            }
          }}
        >
          <div className="input_box">
            <div className="input">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="You@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {message ? (
            <div className={`auth-message ${hasError ? "auth-message-error" : "auth-message-success"}`}>
              {message}
            </div>
          ) : null}

          <div className="submit-container">
            <button
              className="submit submit--login"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Please wait..." : "Send reset link"}
            </button>
          </div>
        </form>

        <div className="side-decor side-decor--forgot" aria-hidden="true">
          <img
            id="left-bee"
            className="bee bee-float"
            src="images/Test_Bee_Logo2.png"
            alt="Bee"
          />
          <img
            id="top-bee"
            className="bee bee-buzz"
            src="images/Test_Bee_Logo4.png"
            alt="Bee"
          />
          <img
            id="right-bee"
            className="bee bee-float"
            src="images/Test_Bee_Logo3.png"
            alt="Bee"
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
