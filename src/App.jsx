import { useEffect, useState } from "react";
import { HashRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Todo from "./pages/Todo.jsx";
import Sign_In from "./pages/Sign_In.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Home from "./pages/Home.jsx";
import Timer from "./pages/Timer.jsx";
import Shop from "./pages/Shop.jsx";
import { Layout } from "./Layout";
import { onAuthStateChange, signOutUser } from "./lib/authentication.js";

function ProtectedLayout({ session }) {
  if (!session) {
    return <Navigate to="/Sign_In" replace />;
  }

  return <Layout />;
}

function PublicSignIn({ session }) {
  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Sign_In />;
}

function PublicForgotPassword({ session }) {
  if (session) {
    return <Navigate to="/" replace />;
  }

  return <ForgotPassword />;
}

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    signOutUser()
      .then(() => {
        if (isMounted) {
          setSession(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSession(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingSession(false);
        }
      });

    const {
      data: { subscription },
    } = onAuthStateChange((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loadingSession) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="/Sign_In" element={<PublicSignIn session={session} />} />
        <Route path="/ForgotPassword" element={<PublicForgotPassword session={session} />} />
        <Route path="/ResetPassword" element={<ResetPassword />} />
        <Route element={<ProtectedLayout session={session} />}>
          <Route path="/Todo" element={<Todo />} />
          <Route path="/Timer" element={<Timer duration={1500000} />} />
          <Route path="/Shop" element={<Shop />} />
          <Route path="/Home" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
