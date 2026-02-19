import "../styles/Sign_In.scss";
function Sign_In(){
    return (
        <div className="container">
            <div className="header">
                <div className="text">Sign Up</div>
                <div className="underline"></div>
            </div>
            <div className="inputs">
                <div className="input">
                    {/* <img src="" alt="" /> */}
                    <i class="fa-solid fa-user"></i>
                    <input type="text" />
                </div>
                <div className="input">
                    {/* <img src="" alt="" /> */}
                    <i class="fa-solid fa-envelope"></i>
                    <input type="email" />
                </div>
                <div className="input">
                    {/* <img src="" alt="" /> */}
                    <i class="fa-solid fa-lock"></i>
                    <input type="password" />
                </div>
            </div>
            <div className="submit-container">
                <div className="submit">Sign Up</div>
                <div className="submit">Login</div>
            </div>
        </div>
    )
}
export default Sign_In;