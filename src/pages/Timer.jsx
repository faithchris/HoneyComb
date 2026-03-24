import "../styles/Timer.scss"; //imports the timer SCSS file
import backButton from "../assets/back-button.svg";
import beeLine from "../assets/Bee Line.svg";
import bee from "../assets/bee.svg";
import honeyLeft from "../assets/honey-left.svg";
import honeyRight from "../assets/honey-right.svg";
import sadBee from "../assets/sad-bee.svg";
import twoFlowers from "../assets/Two_Flowers.svg";
import { supabase } from "../lib/supabaseClient";
import { getCurrentSession } from "../lib/authentication";

import { useState, useEffect } from "react"; // import react hooks:
//useState -> to store changing values (time)
//useEffect -> to run side effects (the timer ticking)


//timer logic goes here

const PRESET_OPTIONS = [
    { label: "50 min", value: 50 * 60 * 1000 },
    { label: "45 min", value: 45 * 60 * 1000 },
    { label: "25 min", value: 25 * 60 * 1000 },
];

const TIMER_STATE_KEY = "honeycomb_timer_state";

export default function Timer({ duration }){ //defines the Timer component and recieves 'duration' as a prop (starting time in milliseconds)
   
    //any hooks go here
  
    const [time, setTime]= useState(duration); // creates a state called 'time' initiallized to 'duration'
                                                //'setTime' is used to update the times as it counts down
    
    const [elapsedSeconds, setElapsedSeconds] = useState(0); //this is where the rate logic starts to show, this tracks how many mintes have been completed
    const [resultModal, setResultModal] = useState({
        open: false,
        message: "",
    });
   
    //const [isRunning, setIsRunning] = useState(false); //this was replaced w/ status, set status for more options (pause, resume, stop)
    
    const [status, setStatus]= useState("idle"); // controls the overall timer state (started, stopped, resumed)
    const [stopModal, setStopModal] = useState(false); //this is for the message that pops up when user hits 'stop'

    const [baseDuration, setBaseDuration] = useState(duration);
    const [selectedPreset, setSelectedPreset] = useState(duration);

    // Restore timer state if user navigated away and came back
    useEffect(() => {
        try {
            const raw = localStorage.getItem(TIMER_STATE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== "object") return;

            const savedBase = typeof saved.baseDuration === "number" ? saved.baseDuration : duration;
            const savedTime = typeof saved.timeRemaining === "number" ? saved.timeRemaining : duration;
            const savedElapsed = typeof saved.elapsedSeconds === "number" ? saved.elapsedSeconds : 0;
            const savedStatus = saved.status || "idle";
            const savedAt = typeof saved.savedAt === "number" ? saved.savedAt : null;

            let nextTime = savedTime;
            let nextElapsed = savedElapsed;

            if (savedStatus === "running" && savedAt) {
                const deltaMs = Date.now() - savedAt;
                if (deltaMs > 0) {
                    nextTime = Math.max(savedTime - deltaMs, 0);
                    nextElapsed = savedElapsed + Math.floor(deltaMs / 1000);
                }
            }

            setBaseDuration(savedBase);
            setSelectedPreset(savedBase);
            setTime(nextTime);
            setElapsedSeconds(nextElapsed);

            if (savedStatus === "running" && nextTime > 0) {
                setStatus("running");
            } else if (savedStatus === "paused" && nextTime > 0) {
                setStatus("paused");
            } else {
                setStatus("idle");
                localStorage.removeItem(TIMER_STATE_KEY);
            }
        } catch (_e) {
            // ignore corrupted saved state
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePresetChange = (nextDuration) => {
        if (status !== "idle") {
            return;
        }
        setBaseDuration(nextDuration);
        setTime(nextDuration);
        setElapsedSeconds(0);
        setSelectedPreset(nextDuration);
    };

    // Persist timer state so it survives navigation away from the page
    useEffect(() => {
        try {
            if (status === "running" || status === "paused") {
                const snapshot = {
                    status,
                    baseDuration,
                    timeRemaining: time,
                    elapsedSeconds,
                    savedAt: Date.now(),
                };
                localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(snapshot));
            } else {
                localStorage.removeItem(TIMER_STATE_KEY);
            }
        } catch (_e) {
            // ignore storage errors
        }
    }, [status, time, elapsedSeconds, baseDuration]);

    function isMissingColumnError(error, tableName, columnName) {
        const message = (error?.message || "").toLowerCase();
        return message.includes(tableName) && message.includes(columnName) && message.includes("does not exist");
    }

    async function ensureProfileRow(userId) {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from("profiles")
            .upsert({ id: userId, honeycomb: 0, updated_at: now }, { onConflict: "id" });

        if (!error) {
            return "honeycomb";
        }

        if (!isMissingColumnError(error, "profiles", "honeycomb")) {
            throw error;
        }

        const { error: legacyError } = await supabase
            .from("profiles")
            .upsert({ id: userId, points: 0, updated_at: now }, { onConflict: "id" });

        if (legacyError) {
            throw legacyError;
        }

        return "points";
    }

    async function loadUserBalance(userId) {
        const { data, error } = await supabase
            .from("profiles")
            .select("honeycomb")
            .eq("id", userId)
            .single();

        if (!error) {
            return { balance: data?.honeycomb ?? 0, column: "honeycomb" };
        }

        if (error?.code === "PGRST116") {
            const column = await ensureProfileRow(userId);
            return { balance: 0, column };
        }

        if (!isMissingColumnError(error, "profiles", "honeycomb")) {
            throw error;
        }

        const { data: legacyData, error: legacyError } = await supabase
            .from("profiles")
            .select("points")
            .eq("id", userId)
            .single();

        if (legacyError?.code === "PGRST116") {
            await ensureProfileRow(userId);
            return { balance: 0, column: "points" };
        }

        if (legacyError) {
            throw legacyError;
        }

        return { balance: legacyData?.points ?? 0, column: "points" };
    }

    async function saveUserBalance(userId, nextTotal, column) {
        const { error } = await supabase
            .from("profiles")
            .update({
                [column]: nextTotal,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (error) {
            throw error;
        }
    }

    async function saveSessionEarnings(userId, durationMs, honeycombEarned) {
        const payload = {
            user_id: userId,
            duration_ms: durationMs,
            honeycomb_earned: honeycombEarned,
        };

        const { error } = await supabase.from("sessions").insert(payload);
        if (!error) {
            return;
        }

        if (!isMissingColumnError(error, "sessions", "honeycomb_earned")) {
            throw error;
        }

        const { error: legacyError } = await supabase.from("sessions").insert({
            user_id: userId,
            duration_ms: durationMs,
            points_earned: honeycombEarned,
        });

        if (legacyError) {
            throw legacyError;
        }
    }
    
  //modal logic for when user preses stop, modals are windows that pop up when an event happens (ie. clicking a button)
    const toggleModal = () => {
        setStopModal(!stopModal);
        setStatus("paused");
    };
   
   //reset logic
    const handleReset = ()=> {
        setStatus("running"); //restarts countdown immidiately
        setTime(baseDuration); //reset countdown
        setElapsedSeconds(0); //clear elapsed tracking (for earned honeycombs)
        setStopModal(false);
    };

    //stop logic goes here --> takes you back to start 
    const handleStop = async ()=> {
        const completedMinutes = Math.floor(elapsedSeconds / 60);
        const honeycombEarned = completedMinutes * 2;
        let resultMessage = `Session complete: +${honeycombEarned} Honeycombs earned.`;

        //this is where honeycomb currency logic goes
        //setElapsedSeconds is handles the minutes accumalated as the timer goes down and that is what gets calculated into the rate
        if (honeycombEarned > 0) {
            try {
                const session = await getCurrentSession();
                let userId = session?.user?.id;

                if (!userId) {
                    const { data } = await supabase.auth.getUser();
                    userId = data?.user?.id || null;
                }

                if (!userId) {
                    resultMessage = `Session complete: +${honeycombEarned} Honeycombs earned. Log in to save them.`;
                } else {
                    const { balance, column } = await loadUserBalance(userId);
                    const newTotal = balance + honeycombEarned;
                    await saveUserBalance(userId, newTotal, column);

                    const durationMs = completedMinutes * 60 * 1000;
                    await saveSessionEarnings(userId, durationMs, honeycombEarned);

                    window.dispatchEvent(
                        new CustomEvent("honeycomb-updated", {
                            detail: {
                                userId,
                                newTotal,
                            },
                        }),
                    );
                }
            } catch (error) {
                const reason = error?.message ? ` Reason: ${error.message}` : "";
                resultMessage = `Session complete: +${honeycombEarned} Honeycombs earned, but they could not be saved.${reason}`;
            }
        } else {
            resultMessage = "Session complete: +0 Honeycombs earned.";
        }

        setStatus("idle"); 
        setTime(baseDuration);
        setElapsedSeconds(0);
        setStopModal(false); //closes modal
        setResultModal({
            open: true,
            message: resultMessage,
        });
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

        return `${formattedMinutes}:${formattedSeconds}` ; //returns the formatted time as a string

        
    };

    const totalMs = baseDuration || duration;
    const rawProgress = totalMs > 0 ? 1 - time / totalMs : 0;
    const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
    const progressAngle = clampedProgress * 360;

//what users see goes here
    return (
        
    <div id="page">
        <div className="timer-cloud timer-cloud-1" aria-hidden="true" />
        <div className="timer-cloud timer-cloud-2" aria-hidden="true" />
        <div className="timer-cloud timer-cloud-3" aria-hidden="true" />
        
        {/* displays the formatted version of the current time*/}
     
      <div id= "timerDisplayYellow">

        <div id="timerDisplayWhite">

        <div className="timer-presets" aria-label="Focus length presets">
            {PRESET_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={[
                        "timer-preset-button",
                        selectedPreset === option.value ? "timer-preset-button--active" : "",
                    ].join(" ")}
                    onClick={() => handlePresetChange(option.value)}
                    disabled={status !== "idle"}
                >
                    {option.label}
                </button>
            ))}
        </div>

        <div id="custom-timer"> {/* creates a box that time will go into, easy for styling purposes in scss */}
            <div
                className="timer-progress-ring"
                aria-hidden="true"
                style={{
                    background: `radial-gradient(circle at center, #FFFAEF 60%, transparent 61%), conic-gradient(#F28A2F 0deg, #F28A2F ${progressAngle}deg, rgba(255, 211, 65, 0.2) ${progressAngle}deg, rgba(255, 211, 65, 0.2) 360deg)`,
                }}
            />
            <div className="timer-icon-wrapper" aria-hidden="true">
                <img src={bee} alt="" />
            </div>
            <div className="timer-time-text">
                {getFormattedTime(time)}
            </div>
        </div>


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
                        <button onClick={handleStop} id="Stop">
                            Stop
                        </button>
                        <button onClick={handleReset} id="Reset">
                            Reset
                        </button>
                        <button
                            onClick={() => {
                                setStatus("running");
                                setStopModal(false);
                            }}
                            id="backButtonWrapper"
                        >
                            <img src={backButton} alt="Back" />
                        </button>
                    </div>
                </div>
                <img src={sadBee} alt="sad" id="sadBee" />
                <img src={twoFlowers} alt="twoFlowers" id="twoFlowers" />
                <img src={beeLine} alt="beeLine" id="beeLine" />
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


        {resultModal.open && (
            <div className="Modal" onClick={() => setResultModal({ open: false, message: "" })}>
                <div className="ModalBox ResultModalBox" onClick={(e) => e.stopPropagation()}>
                    <img src={honeyLeft} alt="" className="ResultDripLeft" aria-hidden="true" />
                    <img src={honeyRight} alt="" className="ResultDripRight" aria-hidden="true" />
                    <img src={bee} alt="" className="ResultBee" aria-hidden="true" />
                    <img src={twoFlowers} alt="" className="ResultFlower" aria-hidden="true" />
                    <h3 className="ResultTitle">Session Complete!</h3>
                    <p className="ResultMessage">{resultModal.message}</p>
                    <div className="ModalButtons">
                        <button id="ResultOk" onClick={() => setResultModal({ open: false, message: "" })}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        )}
                        </div>
                </div>
            
            </div>
    );
    }
            

   






