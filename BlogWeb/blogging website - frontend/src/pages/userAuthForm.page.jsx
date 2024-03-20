import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import GoogleIcon from "../imgs/google.png"
import { Link } from "react-router-dom"
import { useContext, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";
import axios from "axios";

function UserAuthForm({type}){

    let { userAuth: {access_token}, setUserAuth } = useContext(UserContext);

    const userAuthThroughServer = (serverRoute, formData) => {
        console.log(formData);
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
        .then(({data}) => {
            storeInSession("user", JSON.stringify(data));
            setUserAuth(data);
        })
        .catch(({response}) => {
            console.log(response);
            toast.error(response.data.error);
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        let serverRoute = type ==  "sign-in" ? "/signin" : "/signup";

        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

        // Data gathering and forming the data
        let form = new FormData(formElement);
        let formData = {};
        for(let [key, value] of form.entries()){
            formData[key] = value;
        }
        
        // Validation of data
        let { fullname, email, password } = formData;
        
        console.log(formData);

        if(type=="sign-up" && fullname){
            if(fullname.length < 3){
                return toast.error("Full Name must be at least 3 letters long")
            }
        }
        if(!email){
            return toast.error("Email not entered")
        }
        if(!emailRegex.test(email)){
            return toast.error("Email is invalid")
        }
        if(!passwordRegex.test(password)){
            return toast.error("Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters")
        }

        userAuthThroughServer(serverRoute, formData);

    }

    const handleGoogleAuth = (e) => {

        e.preventDefault();
        
        authWithGoogle().then(user => {
            console.log(user.accessToken);
            let serverRoute = "/google-auth";
            let formData = {
                access_token: user.accessToken
            }
            userAuthThroughServer(serverRoute, formData);
        })
        .catch(err => {
            toast.error("trouble login through google");
            return console.log(err);
        })
    }

    return (
        access_token ? 
        <navigate to="/" />
        :  
        <AnimationWrapper keyValue={type}>
            <section className="h-cover flex items-center justify-center">
                <Toaster />
                <form id="formElement" className="w-[80%] max-w-[400px]">
                    <h1 className="text-4xl font-gelasio text-center mb-24">
                        {type === "sign-in" ? "Welcome Back" : "Join Us Today"}
                    </h1>
                    {type !== "sign-in" ? <InputBox 
                        name="fullname"
                        type="text"
                        placeholder="Full Name"
                        icon="fi-rr-user"
                    /> 
                    : ""}
                    <InputBox 
                        name="email"
                        type="email"
                        placeholder="Email"
                        icon="fi-rr-envelope"
                    /> 
                    <InputBox 
                        name="password"
                        type="password"
                        placeholder="Password"
                        icon="fi-rr-lock"
                    /> 
                    <button className="btn-dark center mt-14" type="submit" onClick={handleSubmit}>
                        {type === "sign-in" ? "Sign In" : "Sign Up" }
                    </button>
                    <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black"></hr>
                        OR
                        <hr className="w-1/2 border-black"></hr>
                    </div>
                    <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
                        <img src={GoogleIcon} className="w-5" />
                        Continue with Google
                    </button>
                    {
                        type === "sign-in" ?
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don't have an acoount ? 
                            <Link to="/signup" className="underline text-black text-xl ml-1">Join Us Today</Link>
                        </p> :
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already have an account ?  
                            <Link to="/signin" className="underline text-black text-xl ml-1">Sign In here</Link>
                        </p>
                    }
                </form>
            </section>
        </AnimationWrapper>
    )
}

export default UserAuthForm;