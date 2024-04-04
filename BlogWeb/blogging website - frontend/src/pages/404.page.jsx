import { Link } from "react-router-dom";
import pageNotFound from "../imgs/404.png"
import fullLogo from "../imgs/fullLogo.png"

const PageNotFound = () => {
    return (
        <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">
            <img src={pageNotFound} className="select-none w-72 aspect-square object-cover"/>
            <h1 className="text-4xl font-gelasio leading-7">Page Not Found</h1>
            <p className="text-dark-grey text-xl leading-7 -mt-8">Page you are looking for doest not exists. Head back to <Link to="/" className="text-xl text-black underline">Home Page</Link></p>
            <div className="mt-auto">
                <img src={fullLogo} className="h-24 object-contain block mx-auto select-none"/>
                <p className="mt-5 text-dark">Read milions of stories around the world</p>
            </div>
        </section>
    )
}

export default PageNotFound;