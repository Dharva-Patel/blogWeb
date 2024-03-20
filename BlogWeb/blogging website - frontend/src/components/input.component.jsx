import react, { useState } from "react";

function InputBox(props){
    
    const [ passwordClicked, setPassword ] = useState(false);
    
    return(
        <div className="relative w-[100%] mb-4">
            <input 
                name={props.name}
                type={props.type === "password" ? passwordClicked ? "text" : "password" : props.type}
                placeholder={props.placeholder}
                defaultValue={props.value}
                id={props.id}
                className="input-box"
            />
            <i className={"fi " + props.icon +" input-icon"}></i>
            {props.type === "password" ?  
                <i className={"fi fi-rr-eye" + (passwordClicked === true ? "" : "-crossed") + " input-icon left-[auto] right-4 cursor-pointer"} onClick={() => setPassword(prevValue => prevValue = !prevValue)}></i>
            : ""} 
        </div>
    );
}

export default InputBox;