import react, { useState } from "react";

function InputBox({ name, type, id, value, placeholder, icon, disable = false }){
    
    const [ passwordClicked, setPassword ] = useState(false);
    
    return(
        <div className="relative w-[100%] mb-4">
            <input 
                name={name}
                type={type === "password" ? passwordClicked ? "text" : "password" : type}
                placeholder={placeholder}
                defaultValue={value}
                id={id}
                disabled={disable}
                className="input-box"
            />
            <i className={"fi " + icon +" input-icon"}></i>
            {type === "password" ?  
                <i className={"fi fi-rr-eye" + (passwordClicked === true ? "" : "-crossed") + " input-icon left-[auto] right-4 cursor-pointer"} onClick={() => setPassword(prevValue => prevValue = !prevValue)}></i>
            : ""} 
        </div>
    );
}

export default InputBox;