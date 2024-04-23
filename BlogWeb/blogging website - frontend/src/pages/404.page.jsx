import { Link } from "react-router-dom";
import lightPageNotFound from "../imgs/404-light.png"
import darkPageNotFound from "../imgs/404-dark.png"
import lightFullLogo from "../imgs/full-logo-light.png"
import darkFullLogo from "../imgs/full-logo-dark.png"
import { useContext } from "react";
import { ThemeContext } from "../App";

const PageNotFound = () => {

    let { theme } = useContext(ThemeContext);

    return (
        <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">
            <img src={ theme=="light" ? darkPageNotFound : lightPageNotFound} className="select-none w-72 aspect-square object-cover"/>
            <h1 className="text-4xl font-gelasio leading-7">Page Not Found</h1>
            <p className="text-dark-grey text-xl leading-7 -mt-8">Page you are looking for doest not exists. Head back to <Link to="/" className="text-xl text-black underline">Home Page</Link></p>
            <div className="mt-auto">
                <img src={ theme=="light" ? darkFullLogo : lightFullLogo} className="h-14 object-contain block mx-auto select-none"/>
                <p className="mt-5 text-dark">Read milions of stories around the world</p>
            </div>
        </section>
    )
}

export default PageNotFound;