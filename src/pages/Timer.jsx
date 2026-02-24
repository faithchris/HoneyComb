import "../styles/Timer.scss"; //imports the timer SCSS file
import backButton from "../assets/back-button.svg";
import beeLine from "../assets/Bee Line.svg";
import bee from "../assets/bee.svg";
import honeyDripLong from "../assets/honey-drip-long.svg";
import honeyLeft from "../assets/honey-left.svg";
import honeyRight from "../assets/honey-right.svg";
import sadBee from "../assets/sad-bee.svg";
import twoFlowers from "../assets/Two_Flowers.svg";


import  { useState, useEffect } from "react"; // import react hooks: 
//useState -> to store changing values (time)
//useEffect -> to run side effects (the timer ticking)


//timer logic goes here



export default function Timer({ duration }){ //defines the Timer component and recieves 'duration' as a prop (starting time in milliseconds)
   
    //any hooks go here
  
    const [time, setTime]= useState(duration); // creates a state called 'time' initiallized to 'duration'
                                                //'setTime' is used to update the times as it counts down
    
    const [elapsedSeconds, setElapsedSeconds] = useState(0); //this is where the rate logic starts to show, this tracks how many mintes have been completed 
   
    //const [isRunning, setIsRunning] = useState(false); //this was replaced w/ status, set status for more options (pause, resume, stop)
    
    const [status, setStatus]= useState("idle"); // controls the overall timer state (started, stopped, resumed)
   
    const [stopModal, setStopModal] = useState(false); //this is for the message that pops up when user hits 'stop'
    
  //modal logic for when user preses stop, modals are windows that pop up when an event happens (ie. clicking a button)
    const toggleModal = () => {
        setStopModal(!stopModal);
        setStatus ("Paused");
    };
   
   //reset logic
    const handleReset = ()=> {
        setStatus("running"); //restarts countdown immidiately
        setTime(duration); //reset countdown
        setElapsedSeconds(0); //clear elapsed tracking (for earned honeycombs)
        setStopModal(false);
    };

    //stop logic goes here --> takes you back to start 
    const handleStop = ()=> {
        setStatus("idle"); 
        setTime(duration);
        setElapsedSeconds(0);
        setStopModal(false); //closes modal
        //this is where honeycomb currency logic goes
        //setElapsedSeconds is handles the minutes accumalated as the timer goes down and that is what gets calculated into the rate
    }
    







//this area is what makes the timer work, it decreases by 1000 ms ( 1 second), etc

    useEffect(() => { //runs this effect every time 'time' changes
        if (status !== "running") return; //so that timer wont auto run
        if (time <=0) return; //stops the timer
        const id = setTimeout(() => { //waits 1000 milliseconds (1 second)
            setTime(time-1000) //decreases the current time by 1 second
            setElapsedSeconds(prev => prev +1); 
        }, 1000)

        return () => clearTimeout(id); //so you can clear the timer

    },[time, status]); //dependancy array: this effect reruns whenever 'time' updates, creating a countdown effect


    //this is where the timer is formatted, so that it looks like a timer

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

        return `${formattedMinutes} : ${formattedSeconds}` ; //returns the formatted time as a string

        
    };



//what users see goes here
    return (
        
    <div id="page">
        
        {/* displays the formatted version of the current time*/}
     
      <div id= "timerDisplayYellow">

        
        <div id="timerDisplayWhite">
     
     
      <box id="custom-timer"> {/* creates a box that time will go into, easy for styling purposes in scss */}
        {getFormattedTime(time)} 
        </box>


       <div id="timer-controls"> 
       
       {/* these buttons (Start and Reset) show up when the timer is IDlE. onClick is what is say, when clicked --> this action happens (add logic created further up) */}
       <div id="start-reset">
        
        {status == "idle" && (
            
            <button onClick={() => setStatus("running")} id="Start">
                Start
            </button>   
        )}
        </div>



        {/*these buttons (Pause and Stop) show up once timer is RUNNING */}
        {status == "running" && (
            <>
            <button onClick={() => setStatus("paused")} id= "Pause">
                Pause
            </button>

            <button onClick={toggleModal} id="Stop">
                Stop
            </button>

              
            </>
        )}

      
      
      
      
       {/* modal that users will see when they click stop goes here. the 'e' represents an event within a function. */}
       {/* propragration is when the event that affects the parent, affects the children too. stoPropagation prevents this from happening, without it, it will cause a bug that clicking anywhere with the modal will close the modal */}
        {stopModal && (

            

            <div className="Modal" onClick={toggleModal}>

                

                <div className="ModalBox" onClick={(e) => e.stopPropagation()}>
                
                
                
                <p>Stop this Session?</p>

                <div className="ModalButtons">
                <button onClick={handleStop}id="Stop"> Stop </button>

                <button onClick= {handleReset} id="Reset"> Reset </button>

                <button onClick = {() => {setStatus ("running"); setStopModal(false); }} id ="backButtonWrapper"> 
                <img src ={backButton} alt="Back" />
                </button>

               </div>

               
            </div>
            <img src = {sadBee} alt="sad" id="sadBee" />
                <img src= {twoFlowers} alt="twoFlowers" id="twoFlowers"/>
                <img src= {beeLine} alt="beeLine" id="beeLine"/>

            </div>   
        )}





        {/*these buttons (Resume, Stop) show up when timer is PAUSED */}

        {status == "paused" &&(
            <>
            <button onClick={() => setStatus("running")} id="Resume">
                Resume
            </button>

            <button onClick={toggleModal} id="Stop">
                Stop
            </button>

            
            </>
        )}
        </div>


        {/*WIP Focus mode button for users to toggle --> havent worked on yet, for second milestone */}

        <button id="Focus">Focus</button>
                        </div>
                </div>
            
            </div>
    );
    }
            

   






