<<<<<<< HEAD
import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
=======
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Todo from "./pages/Todo.jsx";
import Sign_In from "./pages/Sign_In.jsx";
import Home from "./pages/Home.jsx";
import Timer from "./pages/Timer.jsx";
import { Layout } from './Layout';
>>>>>>> origin/milestone-one

function App() {

  return (
  

      <Router>
        <Routes>
          <Route element={<Layout/>}>
            <Route path="/" element={<Todo/>}/>
            <Route path="/Sign_In" element={<Sign_In/>}/>
            <Route path="/Timer" element={<Timer duration={1500000}/>}/>
            <Route path="/Home" element={<Home/>}/>
          </Route>
        </Routes>
      </Router>
  );
}



export default App;

