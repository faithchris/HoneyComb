import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Todo from "./pages/Todo.jsx";
import Sign_In from "./pages/Sign_In.jsx";
import { Layout } from './Layout';


function App() {
  return (
    // <BrowserRouter>
    //    <nav>
    //     <Link to "/">Todo</Link> | {""}
    //     <Link to "/">Todo</Link> | {""}
    //   </nav>
    // </BrowserRouter>
    <Router>
      <Routes>
        <Route element={<Layout/>}>
          <Route path="/" element={<Todo/>}/>
          <Route path="/Sign_In" element={<Sign_In/>}/>
        </Route>
      </Routes>
    </Router>
    // <div>
    //   <Todo />
    //   <Sign_In />
    // </div>
  );

}

export default App;