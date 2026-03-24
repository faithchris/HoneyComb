import "../styles/Sign_In.scss";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePasswordToggle from "../hooks/usePasswordToggle.jsx";
import { signInWithEmail, signUpWithEmail } from "../lib/authentication.js";

const Sign_In = () => {
  const [action, setAction] = useState("Sign Up");
  const [passwordInputType, toggleIcon] = usePasswordToggle();
  const [authMessage, setAuthMessage] = useState(null);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");

    if (mode === "login") {
      setAction("Login");
    } else if (mode === "signup") {
      setAction("Sign Up");
    }
  }, [location.search]);

  function onFieldChange(event) {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    setAuthMessage(null);
    const email = formState.email.trim().toLowerCase();
    const password = formState.password;
    const name = formState.name.trim();

    if (!email || !password) {
      setAuthMessage({ type: "error", text: "Email and password are required." });
      return;
    }

    if (action === "Sign Up") {
      if (!name) {
        setAuthMessage({ type: "error", text: "Please enter your name." });
        return;
      }

      if (formState.confirmPassword !== password) {
        setAuthMessage({ type: "error", text: "Passwords do not match." });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (action === "Sign Up") {
        const data = await signUpWithEmail({ name, email, password });
        if (!data.session) {
          setAuthMessage({
            type: "success",
            text: "Account created. Check your email to confirm your account, then log in.",
          });
          setAction("Login");
          setFormState((prev) => ({ ...prev, password: "", confirmPassword: "" }));
        } else {
          navigate("/", { replace: true });
        }
      } else {
        await signInWithEmail({ email, password });
        navigate("/", { replace: true });
      }
    } catch (error) {
      setAuthMessage({
        type: "error",
        text: error?.message || "Authentication failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    setAuthMessage(null);
    setFormState({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  }, [action]);

  return (
    <div className={`Sign_In_Style Sign_In_Style--signup ${action === "Login" ? "Sign_In_Style--login" : ""}`}>
      <header className="sign-in-header">
        <div className="sign-in-header-inner">
          <span className="sign-in-header-spacer" aria-hidden="true" />
          <button
            type="button"
            className={`sign-in-top-btn ${action === "Login" ? "sign-in-top-btn--signup" : "sign-in-top-btn--login"}`}
            onClick={() => setAction(action === "Login" ? "Sign Up" : "Login")}
          >
            {action === "Login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </header>
      <div className="cloud cloud-1" aria-hidden="true" />
      <div className="cloud cloud-2" aria-hidden="true" />
      <div className="cloud cloud-3" aria-hidden="true" />
      <div className="container">
        <div className="header">
          <div>
            <div className="text">honeycomb</div>
            <div className="subtitle-helper">A Focus Timer App</div>
            <div className="subtitle subtitle--context">
              {action === "Login" ? "Welcome back" : "Create your account"}
            </div>
          </div>
        </div>
        <form className="inputs" onSubmit={handleSubmit}>
          {authMessage ? (
            <div
              className={[
                "auth-inline-message",
                authMessage.type === "success" ? "auth-inline-message-success" : "auth-inline-message-error",
              ].join(" ")}
              role="status"
              aria-live="polite"
            >
              {authMessage.text}
            </div>
          ) : null}
          {action === "Login" ? null : (
            <div className="input_box">
              <div className="input">
                <i className="fa-solid fa-user"></i>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={formState.name}
                  onChange={onFieldChange}
                  required={action === "Sign Up"}
                  autoComplete="name"
                />
              </div>
            </div>
          )}
          <div className="input_box">
            <div className="input">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="You@example.com"
                value={formState.email}
                onChange={onFieldChange}
                required
                autoComplete={action === "Login" ? "email" : "username"}
              />
            </div>
          </div>
          <div className="input_box">
            <div className="input2">
              <i className="fa-solid fa-lock"></i>
              <input
                type={passwordInputType}
                placeholder={action === "Login" ? "Enter your password" : "Create a password"}
                name="password"
                value={formState.password}
                onChange={onFieldChange}
                required
                autoComplete={action === "Login" ? "current-password" : "new-password"}
              />
              <span className="password-toggle-icon">{toggleIcon}</span>
            </div>
          </div>
          {action === "Login" ? null : (
            <div className="input_box">
              <div className="input">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={passwordInputType}
                  placeholder="Re-enter your password"
                  name="confirmPassword"
                  value={formState.confirmPassword}
                  onChange={onFieldChange}
                  required={action === "Sign Up"}
                  autoComplete="new-password"
                />
                <span className="password-toggle-icon">{toggleIcon}</span>
              </div>
            </div>
          )}
          <div className="forgot-container">
            <label className="remember-password">
              <input type="checkbox" defaultChecked={true} name="remember" />
              Remember me
            </label>
            {action === "Login" ? (
              <div className="forgot-password">
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    navigate("/ForgotPassword");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            ) : null}
          </div>
          {action === "Login" ? null : (
            <div className="signup-helper">Use a real email address so you can verify your account.</div>
          )}

          <div className="submit-container">
            <button
              className={`submit ${action === "Login" ? "submit--login" : "submit--signup"}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Please wait..." : action === "Login" ? "Log in" : "Sign up"}
            </button>
          </div>
        </form>

        <div className="side-decor" aria-hidden="true">
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
export default Sign_In;
