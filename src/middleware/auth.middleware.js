// Verify user is there or not
import { asyncHandler } from '../utils/asyncHandler.js'
import jwt from "jsonwebtoken"
import { User } from '../models/user.model.js'
import { ApiError } from '../utils/ApiError.js'

export const verifyJWT = asyncHandler( async (req, res, next) => {

    try {
        //we have already use cookie as middleware and add accessToken in cookie while loggedin
        // if user has not cookie peresent mostly in mobile Application then we use header it send "Bearer <Token>"
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    //  console.log("token", token);
     
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log("decodedToken at auth .....", decodedToken);
    
        const user = await User.findById(decodedToken?._id)
            .select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user; // we append user in req.body so logout can easly get
        next();

    } catch (error) {
         throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})