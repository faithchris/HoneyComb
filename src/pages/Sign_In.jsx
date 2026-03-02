import "../styles/Sign_In.scss";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import usePasswordToggle from "../hooks/usePasswordToggle.jsx";
import { signInWithEmail, signUpWithEmail } from "../lib/authentication.js";

const Sign_In = () => {
  const [action, setAction] = useState("Sign Up");
  const [passwordInputType, toggleIcon] = usePasswordToggle();
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
    const email = formState.email.trim().toLowerCase();
    const password = formState.password;
    const name = formState.name.trim();

    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    if (action === "Sign Up") {
      if (!name) {
        alert("Name is required.");
        return;
      }

      if (formState.confirmPassword !== password) {
        alert("Passwords do not match.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (action === "Sign Up") {
        const data = await signUpWithEmail({ name, email, password });
        if (!data.session) {
          alert("Account created. Please confirm your email before logging in.");
          setAction("Login");
        } else {
          navigate("/", { replace: true });
        }
      } else {
        await signInWithEmail({ email, password });
        navigate("/", { replace: true });
      }
    } catch (error) {
      alert(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="Sign_In_Style">
      <div className="container">
        <div className="header">
          {action === "Login" ? null : (
            <div>
              <div className="text">Create Your Account</div>
              <div className="subtitle">Join Honey Comb & become un-bee-table!</div>
            </div>
          )}
          {action === "Sign Up" ? null : (
            <div>
              <div className="text">Welcome Back</div>
              <div className="subtitle">Please enter your account details below.</div>
            </div>
          )}
        </div>
        <div
          className="inputs"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSubmit(event);
            }
          }}
        >
          {action === "Login" ? null : (
            <div className="input_box">
              <p>Name</p>
              <div className="input">
                <i className="fa-solid fa-user"></i>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formState.name}
                  onChange={onFieldChange}
                  required={action === "Sign Up"}
                />
              </div>
            </div>
          )}
          <div className="input_box">
            <p>Email</p>
            <div className="input">
              <i className="fa-solid fa-envelope"></i>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formState.email}
                onChange={onFieldChange}
                required
              />
            </div>
          </div>
          <div className="input_box">
            <p>Password</p>
            <div className="input2">
              <i className="fa-solid fa-lock"></i>
              <input
                type={passwordInputType}
                placeholder="Enter password"
                name="password"
                value={formState.password}
                onChange={onFieldChange}
                required
              />
              <span className="password-toggle-icon">{toggleIcon}</span>
            </div>
          </div>
          {action === "Login" ? null : (
            <div className="input_box">
              <p>Confirm Password</p>
              <div className="input">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={passwordInputType}
                  placeholder="Re-enter password"
                  name="confirmPassword"
                  value={formState.confirmPassword}
                  onChange={onFieldChange}
                  required={action === "Sign Up"}
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
              {isSubmitting ? "Please wait..." : action === "Login" ? "Login" : "Sign Up"}
            </div>
          </div>
        </div>
        <div className="page-change">
          {action === "Login" ? (
            <div className="Sign-Up">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  setAction("Sign Up");
                }}
              >
                Sign up
              </span>
            </div>
          ) : (
            <div className="Login">
              Have an account?{" "}
              <span
                onClick={() => {
                  setAction("Login");
                }}
              >
                Login
              </span>
            </div>
          )}
        </div>

        {action === "Login" ? null : (
          <div className="side-decor">
            <img id="drip1" src="images/Drip 1.png" alt="Honey Drip" />
            <img id="drip2" src="images/Drip 2.png" alt="Honey Drip" />
            <img id="drip3" src="images/Drip 3.png" alt="Honey Drip" />
            <img id="left-drip" src="images/Side-Drip 1.png" alt="Honey Drip" />
            <img id="left-flower" src="images/Two_Flowers2.png" alt="Purple Flower" />
            <img id="two-flowers" src="images/Two_Flowers.png" alt="Flowers" />
            <img id="right-flower" src="images/flower_group.png" alt="Flowers" />
            <img id="right-drip" src="images/Side-Drip 2.png" alt="Honey Drip" />
          </div>
        )}

        {action === "Sign Up" ? null : (
          <div className="side-decor">
            <img id="drip1" src="images/Drip 1.png" alt="Honey Drip" />
            <img id="drip2" src="images/Drip 2.png" alt="Honey Drip" />
            <img id="drip3" src="images/Drip 3.png" alt="Honey Drip" />
            <img id="left-drip-2" src="images/Side-Drip 1.png" alt="Honey Drip" />
            <img id="left-flower-2" src="images/Two_Flowers2.png" alt="Purple Flower" />
            <img id="two-flowers-2" src="images/Two_Flowers.png" alt="Flowers" />
            <img id="right-flower-2" src="images/flower_group.png" alt="Flowers" />
            <img id="right-drip-2" src="images/Side-Drip 2.png" alt="Honey Drip" />
          </div>
        )}
      </div>
    </div>
  );
};
export default Sign_In;
