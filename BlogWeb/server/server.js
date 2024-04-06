import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "./Schema/User.js"
import {nanoid} from "nanoid"
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import aws from "aws-sdk";
import serviceAccountKey from "./blog-website-76d0a-firebase-adminsdk-74if9-afd20fd430.json" assert {type: "json"}
import Blog from "./Schema/Blog.js"
import {getAuth} from "firebase-admin/auth";

dotenv.config();

const app = express();
const port = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey)
})

app.use(express.json());
app.use(cors());

let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

mongoose.connect(process.env.DB_LOCATION, {
    autoIndex: true
});

//setting s3 bucket
const s3 = new aws.S3({
    region: 'ap-south-1',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const generateUploadURL = async () => {

    const date = new Date();
    const imageName = `${nanoid()}-${date.getTime()}.jpeg`;

    return await s3.getSignedUrlPromise('putObject', {
        Bucket: 'blog-website-by-dharva',
        Key: imageName,
        Expires: 1000,
        ContentType: "image/jpeg"
    })

}

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(" ")[1];
    if(token == null){
        return res.status(404).json({error: "No access token"});
    }
    jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
        if(err){
            return res.status(403).json({error: "Access token is Invalid"});
        }
        req.user = user.id;
        next();
    })
}

function formatDatatoSend(user){

    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY)

    return{
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
    }
}

async function generateUsername(email){
    let username = email.split("@")[0];
    let isNotUnique = await User.exists({"personal_info.username": username}).then((result) => result);
    isNotUnique ? username+=nanoid().substring(0,5) : "";
    return username;
}

// upload image url route
app.get('/get-upload-url', (req, res) => {
    generateUploadURL().then(url => res.status(200).json({uploadURL: url}))
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message })
    })
})

app.post("/signup", (req, res) => {
    let { fullname, email, password } = req.body;
    // data validation
    if(fullname?.length < 3){
        return res.status(403).json({"error": "Full Name must be at least 3 letters long"})
    }
    if(!email.length){
        return res.status(403).json({"error": "Email not entered"})
    }
    if(!emailRegex.test(email)){
        return res.status(403).json({"error": "Email is invalid"})
    }
    if(!passwordRegex.test(password)){
        return res.status(403).json({"error": "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters"})
    }
    bcrypt.hash(password, 10, async (err, hashPassword) => {
        if(err) console.log(err);
        else{
            let username = await generateUsername(email);
            let user = new User({
                personal_info: { fullname, email, password: hashPassword, username }
            })
            user.save().then((u) => {
                return res.status(200).json(formatDatatoSend(u))
            })
            .catch(err => {
                if(err.code === 11000){
                    return res.status(500).json({"error": "Email already exists"})
                }
                return res.status(500).json({ "error": err.message});
            })
        }
    });
});

app.post("/signin", (req, res) => {
    let {email, password} = req.body;
    User.findOne({"personal_info.email": email})
    .then((user) => {
        if(!user) return res.status(403).json({ "error": "Email not found" });
        if(!user.google_auth){
            bcrypt.compare(password, user.personal_info.password, (err, result) => {
                if(err){
                    return res.status(403).json({ "error" : "Error occured while login please try again"});
                }
                if(!result){
                    return res.status(403).json({ "error" : "Incorrect Password" });
                }
                else{
                    return res.status(200).json(formatDatatoSend(user));
                }
            })
        }
        else {
            return res.status(403).json({"error": "Account created with google. Try logging in"})
        }
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ "error": err.message });
    })
})

app.post("/google-auth", async (req, res) => {
    let { access_token } = req.body;
    getAuth()
    .verifyIdToken(access_token)
    .then(async (decodedUser) => {
        
        let { name, picture, email } = decodedUser;
        picture = picture.replace("s96-c", "s384-c");

        let user = await User.findOne({"personal_info.email": email}).select("personal_info.fullname personal_info.username personal_info.profile_img google_auth").then((u) => {
            return u || null
        })
        .catch(err => {
            return res.status(500).json({ "error": err.message });
        })
        
        if(user){ //login
            if(!user.google_auth){
                return res.status(403).json({"error": "This email is already signed in without google, please log in with password to access the account"});
            }
        }
        else{ //signup
            let username = await generateUsername(email);
            user = new User({
                personal_info: {fullname: name, email, username},
                google_auth: true
            })
            await user.save().then((u) => {
                user = u;
            })
            .catch(err => {
                return res.status(500).json({"error": err.message});
            })
        }
        return res.status(200).json(formatDatatoSend(user));
    })
    .catch(err => {
        return res.status(500).json({"error": "Failed to authenticate your google account. Try with another account"});
    })
})

import ImageDetails from "./Schema/image-model.js";
const Images = mongoose.model("ImageDetails");

app.post("/upload-image", async(req, res) => {
    const {base64} = req.body;
    try{
        Images.create({image:base64});
        res.send({Status:"ok"});
    }
    catch{
        res.send({Status:"error", data:error})
    }
})

app.post('/latest-blogs', (req, res) => {

    let { page } = req.body;
    let maxLimit = 5;

    Blog.find({ draft: false })
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1)*maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

app.post("/all-latest-blogs-count", (req, res) => {
    Blog.countDocuments({ draft: false })
    .then(count => {
        return res.status(200).json({ totalDocs: count })
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message });
    })
})

app.post("/search-blogs-count", (req, res) => {
    let {tag, author, query} = req.body;
    let findQuery;
    if(tag){
        findQuery = { tags: tag, draft: false };
    }
    else if(query){
        findQuery = { title: new RegExp(query, 'i'), draft: false };
    }
    else if(author) {
        findQuery = { author, draft:false }
    }

    Blog.countDocuments(findQuery)
    .then(count => {
        return res.status(200).json({ totalDocs: count });
    })
    .catch(err => {
        console.log(err.message);
        return res.status(500).json({ error: err.message });
    })
})

app.post("/search-users", (req, res) => {
    let { query } = req.body;
    User.find({"personal_info.username": new RegExp(query, 'i')})
    .limit(50)
    .select("personal_info.fullname personal_info.username personal_info.profile_img -_id")
    .then(users => {
        return res.status(200).json({ users });
    })
    .catch(err => {
        return res.status(500).json({error: err.message});
    })
})

app.get("/trending-blogs", (req, res) => {
    Blog.find({draft: false})
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1})
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })
})

app.post("/search-blogs", (req, res) => {
    let { tag, query, author, page, limit, eliminate_blog } = req.body;
    let findQuery;
    if(tag){
        findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    }
    else if(query){
        findQuery = { title: new RegExp(query, 'i'), draft: false };
    }
    else if(author) {
        findQuery = { author, draft:false }
    }

    let maxLimit = limit ? limit : 2;
    Blog.find(findQuery)
    .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
    .sort({ "publishedAt": -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page-1)*maxLimit)
    .limit(maxLimit)
    .then(blogs => {
        return res.status(200).json({ blogs })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message })
    })
})

app.post("/get-profile", (req, res) => {
    let { username } = req.body;
    User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then(user => {
        return res.status(200).json(user)
    })
    .catch(err => {
        console.log(err);
        return res.status(500).json({error: err.message});
    })
})

app.post("/create-blog", verifyJWT,(req, res) => {
    let authorId = req.user;
    let { title, des, banner, tags, content, draft } = req.body;

    if(!title.length){
        return res.status(403).json({error: "You must provide a title to publish the blog"});
    }

    if(!draft){
        if(!des.length || des.length > 200){
            return res.status(403).json({error: "You must provide blog description under 200 characters"});
        }
        if(!banner.length){
            return res.status(403).json({error: "You must provide blog banner to publish the blog"});
        }
        if(!content.blocks.length){
            return res.status(403).json({ error: "There must be some blog content to publish it" });
        }
        if(!tags.length || tags.length>10){
            return res.status(403).json({ error: "Provide tags in order to publish the blog (Max 10)" });
        }
    }

    tags = tags.map(tag => tag.toLowerCase());
    let blog_id = title.replace(/[^a-zA-z0-9]/g, ' ').replace(/\s+/g,"-").trim() +nanoid();

    let blog = new Blog({
        title, des, banner, content, tags, author: authorId, blog_id, draft: Boolean(draft)
    })
    blog.save().then(blog => {
        let incrementVal = draft ? 0 : 1;
        User.findOneAndUpdate({ _id: authorId }, { $inc : { "account_info.total_posts": incrementVal }, $push: { "blogs": blog._id} })
        .then(user => {
            return res.status(200).json({ id: blog.blog_id });
        })
        .catch(err => {
            return res.status(500).json( {error: "Failed to update total posts number"} )
        })
    })
    .catch(err => {
        return res.status(500).json({ error: err.message });
    })

})

app.post("/get-blog", (req, res) => {
    let { blog_id } = req.body;
    let incrementVal = 1;
    Blog.findOneAndUpdate({ blog_id }, { $inc : {"activity.total_reads" : incrementVal} })
    .populate("author", "personal_info.fullname personal_info.username personal_info.profile_img")
    .select("title des content banner activity publishedAt blog_id tags")
    .then(blog => {
        User.findOneAndUpdate({ "personal_info.username": blog.author.personal_info.username }, {
            $inc : { "account_info.total_reads": incrementVal } 
        })
        .catch(err => {
            return res.status(500).json({error: err.message});
        })
        return res.status(200).json({ blog });
    })
    .catch(err => {
        return res.status(500).json({ error : err.message});
    })
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});