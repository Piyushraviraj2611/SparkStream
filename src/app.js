import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()


// app.use is used to configure the middleware.
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential:true
}))
app.use(express.json({  // It is used to limit the size of the request body.
    limit:"16kb"
}))
// This middleware is used to keep url same for all requests.Extended is used so that make object inside object.
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))
//This middleware is Public asset to store data temperary. public is name of file which we already created.
app.use(express.static("public"))
//This middleware is used to give access of Cookies.
app.use(cookieParser());


// route import 
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from "./routes/playlist.routes.js"
import commentRouter from "./routes/comment.routes.js"
import videoRouter from "./routes/video.routers.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import likeRouter from "./routes/like.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
// app.get("/",(req,res)=>{
//     // console.log("Hello ");
//     res.status(200).json({
//         message:"ok"
//     })
// })

// route declarartion
app.use("/api/v1/users",userRouter)  // we are not use app.get because app.use use as middleware.
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/healthcheck",healthcheckRouter)

export { app }; 