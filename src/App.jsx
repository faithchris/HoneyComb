import { useEffect } from "react";
import { supabase } from "./lib/supabaseClient";

function App() {

  return (
    <div className="App">
    <Timer duration = {1500000} />
    </div>
  );
}



export default App;

