import "../styles/Todo.scss";
import React, {useState} from 'react';

function Todo(){

    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");
    // const [isChecked, setIsChecked] = useState("false");

    // function handleCheckboxChange(){
    //     setIsChecked(!isChecked);
    // }

    function handleInputChange(event){
        setNewTask(event.target.value);
    }

    function addTask(){
        if(newTask.trim() !== ""){
            setTasks(t => [...t, { text: newTask, completed: false }]);
            setNewTask("");
        }

    }   

    function deleteTask(index){
        setTasks(tasks.filter((_, i) => i !== index));
        // setTasks(updatedTasks);
    }

    function taskState(index) {
        const update = [...tasks];
        update[index].completed = !update[index].completed;
        setTasks(update);
    }



    return(
        <div className="container">
            <div className="todo-app">
                <div className="title">
                    <img src="images/Test_Bee_Logo4.png" alt="Bee" />
                    <h2>To-Do List</h2>
                </div>
                <div className="row">
                    <input type="text" id="input-box" placeholder="Add your text" value={newTask} onChange={handleInputChange} />
                    <button className="add-button" onClick= {addTask}>Add</button>
                </div>
                <ol id="list-container">
                    {tasks.map((task, index) => (
                        <li key={index} className={task.completed ? "checked" : ""} onClick={() => taskState(index)} >
                            {task.text}
                            {/* <input type="checkbox" class="check-input" id="checkbox1" onChange={handleCheckboxChange} /> */}
                            {/* <button className="checked" onClick={() => deleteTask(index)}></button> */}
                            <span className="delete" onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(index);
                            }}>x</span>
                            {/* <button className="delete-button" onClick={() => deleteTask(index)}></button> */}
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
    );

}

export default Todo;