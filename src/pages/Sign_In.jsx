import "../styles/Sign_In.scss";
import React, { useState } from 'react';

const Sign_In = () => {

    const [action,setAction] = useState("Sign Up");

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
                <div className="inputs">
                    {action === "Login" ? null : (
                        <div className="input_box">
                            <p>Name</p>
                            <div className="input">
                                {/* <img src="" alt="" /> */}
                                <i className="fa-solid fa-user"></i>
                                <input type="text" placeholder="Enter your name" required/>
                            </div>
                        </div>
                    )}
                    <div className="input_box">
                         <p>Email</p>
                         <div className="input">
                            {/* <img src="" alt="" /> */}
                            <i className="fa-solid fa-envelope"></i>
                            <input type="email" placeholder="Enter your email" required/>
                        </div>
                    </div>
                    <div className="input_box">
                        <p>Password</p>
                        <div className="input">
                            {/* <img src="" alt="" /> */}
                            <i className="fa-solid fa-lock"></i>
                            <input type="password" placeholder="Enter password" name="psw" required/>
                        </div>
                    </div>
                    {action === "Login" ? null : (
                        <div className="input_box">
                            <p>Password</p>
                            <div className="input">
                                {/* <img src="" alt="" /> */}
                                <i className="fa-solid fa-lock"></i>
                                <input type="password" placeholder="Confirm password" name="psw-repeat" required/>
                            </div>
                        </div>
                    )}
                </div>
                <div className="forgot-container">
                    <label className="remember-password">
                        <input type="checkbox" defaultChecked={true} name="remember"/>
                        Remember me
                    </label>
                    <div className="forgot-password"><a href="#">Forgot Password?</a></div>
                </div>

                {/* {action==="Sign Up"?<div></div>:<div className="Sign-Up">Don't have an account? <span>Sign up</span></div>}
                {action==="Login"?<div></div>:<div className="Login">Have an account? <span>Login</span></div>}
                <div className="submit-container">
                    <div className={action==="Login"?"submit gray":"submit"} onClick={()=>{setAction("Sign Up")}}>Sign Up</div>
                    <div className={action==="Sign Up"?"submit gray":"submit"} onClick={()=>{setAction("Login")}}>Login</div>
                </div> */}
                <div className="submit-container">
                    <div className="submit">
                        {action === "Login" ? "Login" : "Sign Up"}
                    </div>
                </div>
                <div className="page-change">
                    {action==="Login"?(
                        <div className="Sign-Up">
                            Don't have an account? <span onClick={() => setAction("Sign Up")}>Sign up</span>
                        </div>
                    ) : (
                        <div className="Login">
                            Have an account? <span onClick={() => setAction("Login")}>Login</span>
                        </div>

                    )}
                </div>

                <div className="side-decor">
                    <img id="drip1" src="images/Drip 1.png" alt="Honey Drip" />
                    <img id="drip2" src="images/Drip 2.png" alt="Honey Drip" />
                    <img id="drip3" src="images/Drip 3.png" alt="Honey Drip" />
                    <img id="left-drip" src="images/Side-Drip 1.png" alt="Honey Drip" />
                    <img id="left-flower" src="images/Orchid.png" alt="Purple Flower" />
                    <img id="two-flowers" src="images/Two_Flowers.png" alt="Flowers" />
                    <img id="right-drip" src="images/Side-Drip 2.png" alt="Honey Drip" />
                    {/* <img id="purple-flower" src="images/Orchid.png" alt="Purple Flower" /> */}
                    {/* <img id="white-flower" src="images/Flower_Line.png" alt="White Flower" /> */}
                </div> 
            </div>
        </div>
    )
}
export default Sign_In;