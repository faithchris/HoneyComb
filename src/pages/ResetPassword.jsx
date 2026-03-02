import "../styles/Sign_In.scss";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import usePasswordToggle from "../hooks/usePasswordToggle.jsx";
import {
  getCurrentSession,
  initializeRecoverySessionFromUrl,
  signOutUser,
  updateCurrentUserPassword,
} from "../lib/authentication.js";

const ResetPassword = () => {
  const [passwordInputType, toggleIcon] = usePasswordToggle();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        await initializeRecoverySessionFromUrl();
      } catch (_error) {
        // Fall through and validate current session below.
      } finally {
        try {
          const session = await getCurrentSession();
          if (!isMounted) {
            return;
          }

          if (!session) {
            setIsSessionValid(false);
            setHasError(true);
            setMessage("Reset link is invalid or expired. Request a new password reset email.");
          }
        } catch (_error) {
          if (isMounted) {
            setIsSessionValid(false);
            setHasError(true);
            setMessage("Unable to validate reset session. Please request a new reset email.");
          }
        } finally {
          if (isMounted) {
            setIsReady(true);
          }
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (password.length < 6) {
      setHasError(true);
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setHasError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setHasError(false);
    setMessage("");

    try {
      await updateCurrentUserPassword(password);
      await signOutUser();
      setHasError(false);
      setMessage(
        "Your new password was successfully created. You can now log in with your new password.",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const rawMessage = (error?.message || "").toLowerCase();
      const reusedPasswordError =
        rawMessage.includes("different from the old password") ||
        rawMessage.includes("new password should be different") ||
        rawMessage.includes("same as the old password");

      setHasError(true);
      setMessage(
        reusedPasswordError
          ? "You cannot reuse your current password. Please choose a different password."
          : error.message || "Unable to update password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="Sign_In_Style">
      <div className="container forgot-password-page">
        <div className="header">
          <div>
            <div className="text">Set New Password</div>
            <div className="subtitle">Enter and confirm your new password.</div>
          </div>
        </div>

        <div
          className="inputs"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !isSubmitting && isReady && isSessionValid) {
              handleSubmit(event);
            }
          }}
        >
          <div className="input_box">
            <p>New Password</p>
            <div className="input2">
              <i className="fa-solid fa-lock"></i>
              <input
                type={passwordInputType}
                name="password"
                placeholder="Enter new password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (hasError && isSessionValid) {
                    setHasError(false);
                    setMessage("");
                  }
                }}
                required
                disabled={!isReady}
              />
              <span className="password-toggle-icon">{toggleIcon}</span>
            </div>
          </div>

          <div className="input_box">
            <p>Confirm Password</p>
            <div className="input2">
              <i className="fa-solid fa-lock"></i>
              <input
                type={passwordInputType}
                name="confirmPassword"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  if (hasError && isSessionValid) {
                    setHasError(false);
                    setMessage("");
                  }
                }}
                required
                disabled={!isReady}
              />
              <span className="password-toggle-icon">{toggleIcon}</span>
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
              if (!isSubmitting && isReady && isSessionValid) {
                handleSubmit(event);
              }
            }}
            role="button"
            aria-disabled={isSubmitting || !isReady || !isSessionValid}
          >
            {isSubmitting ? "Please wait..." : "Update Password"}
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

export default ResetPassword;
