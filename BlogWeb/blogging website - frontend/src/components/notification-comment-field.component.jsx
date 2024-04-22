import { Toaster, toast } from "react-hot-toast";
import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../App";

const NotificationCommentField = ( { _id, blog_author, index = undefined, replyingTo = undefined, setReplying, notification_id, notificationData } ) => {

    let [ comment, setComment ] = useState('');

    let { _id: user_id } = blog_author;
    let { userAuth: { access_token } } = useContext(UserContext);
    let { notifications, notifications: { results }, setNotifications } = notificationData;
    
    const handleComment = () => {
        if(!comment.length){
            return toast.error("Can't Submit an empty Comment !")
        }

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/add-comment", {
            _id, blog_author: user_id, comment, replying_to: replyingTo, notification_id
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(({ data }) => {
            
            setReplying(false);
            results[index].reply = { comment, _id: data._id }
            setNotifications({ ...notifications, results })

        })
        .catch(err => {
            console.log(err);
        })
    }

    return (
        <>
            <Toaster />
            <textarea value={comment} placeholder={"Write a Reply..." }
            onChange={(e) => setComment(e.target.value)}
            className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"></textarea>
            <button className="btn-dark mt-5 px-10" onClick={handleComment}>Reply</button>
        </>
    );
}

export default NotificationCommentField;