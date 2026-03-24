import "../styles/Todo.scss";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { getCurrentSession } from "../lib/authentication";

function Todo() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [taskColors, setTaskColors] = useState({});
  const [newTaskColor, setNewTaskColor] = useState("blue");
  const [composerDateKey, setComposerDateKey] = useState(null);
  const [userId, setUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
   const [currentMonth, setCurrentMonth] = useState(() => {
     const today = new Date();
     return new Date(today.getFullYear(), today.getMonth(), 1);
   });
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
      .select("id, text, completed, created_at")
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

  function handleDayClick(day) {
    setSelectedDate(day);
    setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
  }

  function handleDayKeyDown(event, day) {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleDayClick(day);
    }
  }

  function isSameDay(dateA, dateB) {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  }

  function getDateKey(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  const tasksByDate = tasks.reduce((accumulator, task) => {
    if (!task.created_at) {
      return accumulator;
    }
    const created = new Date(task.created_at);
    const key = getDateKey(created);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(task);
    return accumulator;
  }, {});

  const today = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const calendarStart = new Date(startOfMonth);
  calendarStart.setDate(startOfMonth.getDate() - startDay);
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function goToPreviousMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function formatSelectedDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
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
        created_at: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          12,
          0,
          0,
          0,
        ).toISOString(),
      })
      .select("id, text, completed, created_at")
      .single();

    if (error) {
      setErrorMessage(error.message || "Failed to add task.");
      return;
    }

    setTasks((prev) => [...prev, data]);
    setTaskColors((prev) => ({ ...prev, [data.id]: newTaskColor }));
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
      <div className="cloud cloud-1" aria-hidden="true" />
      <div className="cloud cloud-2" aria-hidden="true" />
      <div className="cloud cloud-3" aria-hidden="true" />
      <div className="container">
        <div className="todo-layout">
          <section className="todo-calendar-shell">
            <header className="todo-calendar-header">
              <button
                type="button"
                className="todo-calendar-nav-button"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                ‹
              </button>
              <div className="todo-calendar-title">
                {currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </div>
              <button
                type="button"
                className="todo-calendar-nav-button"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </header>
            <div className="todo-calendar-weekdays">
              {weekdayLabels.map((label) => (
                <div key={label} className="todo-calendar-weekday">
                  {label}
                </div>
              ))}
            </div>
            <div className="todo-calendar-grid">
              {calendarDays.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                const isCurrentMonth =
                  date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
                const dateKey = getDateKey(date);
                const dayTasks = tasksByDate[dateKey] || [];

                return (
                  <div
                    key={date.toISOString()}
                    className={[
                      "todo-calendar-day",
                      isSelected ? "todo-calendar-day--selected" : "",
                      isToday ? "todo-calendar-day--today" : "",
                      isCurrentMonth ? "" : "todo-calendar-day--outside-month",
                      dayTasks.length > 0 ? "todo-calendar-day--has-tasks" : "",
                    ].join(" ")}
                    onClick={() => handleDayClick(date)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => handleDayKeyDown(event, date)}
                  >
                    <div className="todo-calendar-day-header">
                      <span className="todo-calendar-day-number">{date.getDate()}</span>
                      <button
                        type="button"
                        className="todo-calendar-day-add"
                        aria-label="Add task on this day"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDayClick(date);
                          setComposerDateKey(dateKey);
                          setTimeout(() => {
                            inputRef.current?.focus();
                          }, 0);
                        }}
                      >
                        +
                      </button>
                    </div>
                    <ul
                      className="todo-calendar-day-tasks"
                      onClick={(event) => {
                        event.stopPropagation();
                      }}
                    >
                      {composerDateKey === dateKey ? (
                        <li className="todo-inline-composer">
                          <input
                            ref={inputRef}
                            type="text"
                            className="todo-inline-input"
                            placeholder="Add a task"
                            value={newTask}
                            onChange={handleInputChange}
                          />
                          <div className="todo-inline-controls">
                            <div className="todo-inline-colors">
                              {["blue", "green", "purple", "yellow", "red"].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className={[
                                    "todo-inline-color-dot",
                                    `todo-inline-color-dot--${color}`,
                                    newTaskColor === color ? "todo-inline-color-dot--selected" : "",
                                  ].join(" ")}
                                  aria-label={`Use ${color} color`}
                                  onClick={() => setNewTaskColor(color)}
                                />
                              ))}
                            </div>
                            <button
                              type="button"
                              className="todo-inline-add"
                              onClick={(event) => {
                                event.stopPropagation();
                                addTask();
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </li>
                      ) : null}
                      {dayTasks.slice(0, 3).map((task) => (
                        <li
                          key={task.id}
                          className={[
                            "todo-calendar-task",
                            task.completed ? "todo-calendar-task--completed" : "",
                            `todo-calendar-task--${taskColors[task.id] || "blue"}`,
                          ].join(" ")}
                          onClick={() => taskState(task.id, task.completed)}
                        >
                          <button
                            type="button"
                            className="todo-calendar-task-check"
                            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                            onClick={(e) => {
                              e.stopPropagation();
                              taskState(task.id, task.completed);
                            }}
                          >
                            <span className="todo-calendar-task-check-icon" aria-hidden="true">
                              {task.completed ? "✓" : ""}
                            </span>
                          </button>
                          <span className="todo-calendar-task-text">{task.text}</span>
                          <button
                            type="button"
                            className="todo-calendar-task-delete"
                            aria-label="Delete task"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteTask(task.id);
                            }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                      {dayTasks.length > 3 ? (
                        <li className="todo-calendar-more">+{dayTasks.length - 3} more</li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {errorMessage ? <p className="todo-error">{errorMessage}</p> : null}

      </div>
    </div>
  );
}

export default Todo;
