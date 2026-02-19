import { Link } from "react-router-dom"

export function Navbar() {
    return(
        <>
            <Link to="/">
                <button>Todo</button>
            </Link>
            <Link to="/Sign_In">
                <button>Sign_In</button>
            </Link>
        </>
    )
}