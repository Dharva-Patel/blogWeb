import { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";

const HomePage = () => {

    let [ blogs, setBlog ] = useState(null);
    let [ trendingBlogs, setTrendingBlog ] = useState(null);
    let [ pageState, setPageState ] = useState("home");

    let categories = ["programming", "travel", "explore", "food", "development", "technology", "sports", "finance", "photography", "film making"];

    const fetchLatestBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs")
        .then(({data}) => {
            setBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    const fetchTrendingBlogs = () => {
        axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
        .then(({data}) => {
            setTrendingBlog(data.blogs);
        })
        .catch(err => {
            console.log(err);
        })
    }

    const loadBlogByCategory = (e) => {
        let category = e.target.innerText.toLowerCase();
        setBlog(null);
        if(pageState == category){
            setPageState("home");
            return;
        }
        setPageState(category);
    }

    useEffect(() => {
        activeTabRef.current.click();
        if(pageState == "home"){
            fetchLatestBlogs();
        }
        if(!trendingBlogs){
            fetchTrendingBlogs();
        }
    },[pageState]);

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                {/* latest Blog */}
                <div className="w-full">
                    <InPageNavigation routes={[pageState, "trending blogs"]} defaultHidden={["trending blogs"]}>
                        <>
                            {
                                blogs == null ? <Loader /> :
                                blogs.map((blog, i) => {
                                    return <AnimationWrapper transition={{duration:1, delay: i*.1}} key={i}>
                                        <BlogPostCard content={blog} author={blog.author.personal_info}/>
                                    </AnimationWrapper>
                                })
                            }
                        </>
                        {
                            trendingBlogs == null ? <Loader /> :
                            trendingBlogs.map((blog, i) => {
                                return <AnimationWrapper transition={{duration:1, delay: i*.1}} key={i}>
                                    <MinimalBlogPost blog={blog} index={i}/>
                                </AnimationWrapper>
                            })    
                        }
                    </InPageNavigation>
                </div>
                {/* filters and trending Blogs */}
                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <div>
                            <h1 className="font-medium text-xl mb-8">Stories from all interests</h1>
                            <div className="flex gap-3 flex-wrap">
                                {
                                    categories.map((category, i) => {
                                        return (
                                            <button className={"tag " + (pageState == category ? "bg-black text-white" : "")} key={i} onClick={loadBlogByCategory}>
                                                {category}
                                            </button>
                                        )
                                    })
                                }
                            </div>
                        </div>
                    
                        <div>
                            <h1 className="font-medium text-xl mb-8">Trending <i className="fi fi-rr-arrow-trend-up"></i> </h1>
                            {
                                trendingBlogs == null ? <Loader /> :
                                trendingBlogs.map((blog, i) => {
                                    return <AnimationWrapper transition={{duration:1, delay: i*.1}} key={i}>
                                        <MinimalBlogPost blog={blog} index={i}/>
                                    </AnimationWrapper>
                                })    
                            }
                        </div>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    )
}

export default HomePage;