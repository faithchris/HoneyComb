import "./Timer.scss"; //imports the timer SCSS file

import  { useState, useEffect } from "react"; // import react hooks: 
//useState -> to store changing values (time)
//useEffect -> to run side effects (the timer ticking)

//timer logic goes here
export default function Timer({ duration }){ //defines the Timer component and recieves 'duration' as a prop (starting time in milliseconds)
    const [time, setTime]= useState(duration); // creates a state called 'time' initiallized to 'duration'
                                                //'setTime' is used to update the times as it counts down

    useEffect(() => { //runs this effect every time 'time' changes
        if (time <=0) return; //stops the timer
        setTimeout(() => { //waits 1000 milliseconds (1 second)
            setTime(time-1000) //decreases the current time by 1 second
        }, 1000)
    },[time]) //dependancy array: this effect reruns whenever 'time' updates, creating a countdown effect

    const getFormattedTime = (milliseconds) => {  //converts time from milliseconds into hours, minutes, and seconds
        
        let total_seconds = parseInt(Math.floor(milliseconds/1000)); //converts milliseconds into total seconds

        let total_minutes = parseInt(Math.floor(total_seconds/60));  //converts total seconds into minutes
        
        let total_hours = parseInt(Math.floor(total_minutes/60));  //converts total minutes into hours

        let seconds = parseInt(total_seconds % 60);  //Gets remaining seconds after minutes are removed

        let minutes = parseInt(total_minutes % 60); //Gets remaining minutes after hours are removed

        let hours = parseInt(total_hours % 24); //Gets hours after days are removed (mod 24 to prevent infinite growth)

        const formattedHours = String(hours).padStart(2,"0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(seconds).padStart(2, "0");

        return `${formattedHours} : ${formattedMinutes} : ${formattedSeconds}` ; //returns the formatted time as a string

        
    };

//what users see goes here
    return (
        
    <div id="main-title">
        {/* displays the formatted version of the current time*/}
      <box id="custom-timer"> {/* creates a box that time will go into, easy for styling purposes in scss */}
        {getFormattedTime(time)} 
        </box>
        <button id="Start">Start</button>

        <button id="Reset">Reset</button>
            
            </div>
    );
    }
            

   






