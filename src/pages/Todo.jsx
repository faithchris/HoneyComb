import "../styles/Todo.scss";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getCurrentSession } from "../lib/authentication";

function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [userId, setUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const session = await getCurrentSession();
        const currentUser = session?.user;

        if (!currentUser) {
          navigate("/Sign_In", { replace: true });
          return;
        }

        if (!isMounted) {
          return;
        }

        setUserId(currentUser.id);
        await fetchTasks(currentUser.id);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Failed to load tasks.");
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  async function fetchTasks(currentUserId) {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, text, completed")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    setTasks(data || []);
  }

  function handleInputChange(event) {
    setNewTask(event.target.value);
  }

  function handleRowClick(event) {
    if (event.target.closest("button")) {
      return;
    }

    inputRef.current?.focus();
  }

  async function addTask() {
    const taskText = newTask.trim();
    if (!taskText || !userId) {
      return;
    }

    setErrorMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        text: taskText,
      })
      .select("id, text, completed")
      .single();

    if (error) {
      setErrorMessage(error.message || "Failed to add task.");
      return;
    }

    setTasks((prev) => [...prev, data]);
    setNewTask("");
  }

  async function deleteTask(taskId) {
    setErrorMessage("");

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      setErrorMessage(error.message || "Failed to delete task.");
      return;
    }

    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  }

  async function taskState(taskId, currentState) {
    setErrorMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: !currentState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select("id, text, completed")
      .single();

    if (error) {
      setErrorMessage(error.message || "Failed to update task.");
      return;
    }

    setTasks((prev) => prev.map((task) => (task.id === taskId ? data : task)));
  }

  return (
    <div className="Todo_Style">
      <div className="container">
        <div className="todo-app">
          <div className="title">
            <img src="images/Test_Bee_Logo4.png" alt="Bee" />
            <h2>To-Do List</h2>
          </div>
          <div className="row" onClick={handleRowClick}>
            <input
              ref={inputRef}
              type="text"
              id="input-box"
              placeholder="Add your text"
              value={newTask}
              onChange={handleInputChange}
            />
            <button className="add-button" onClick={addTask}>
              Add
            </button>
          </div>
          {errorMessage ? <p style={{ color: "#b00020", marginTop: "8px" }}>{errorMessage}</p> : null}
          <ol id="list-container">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={task.completed ? "checked" : ""}
                onClick={() => taskState(task.id, task.completed)}
              >
                {task.text}
                <span
                  className="delete"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteTask(task.id);
                  }}
                >
                  x
                </span>
              </li>
            ))}
          </ol>
          <div className="side-decor">
            <img id="drip1" src="images/Drip 1.png" alt="Honey Drip" />
            <img id="drip2" src="images/Drip 2.png" alt="Honey Drip" />
            <img id="drip3" src="images/Drip 3.png" alt="Honey Drip" />
            <img id="left-drip" src="images/Side-Drip 1.png" alt="Honey Drip" />
            <img id="left-flower" src="images/Orchid.png" alt="Purple Flower" />
            <img id="two-flowers" src="images/Two_Flowers.png" alt="Flowers" />
            <img id="right-drip" src="images/Side-Drip 2.png" alt="Honey Drip" />
            <img id="purple-flower" src="images/Orchid.png" alt="Purple Flower" />
            <img id="white-flower" src="images/Flower_Line.png" alt="White Flower" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Todo;
