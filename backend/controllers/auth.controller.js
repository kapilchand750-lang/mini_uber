const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");
const sessionService = require("../services/session.service");


async function register(req, res) {
    try {
        const user = await authService.registerUser(req.body);

        return res.status(201).json({
            success : true,
            message: "User registerd successfully.",
            data: {user}
        });
    } catch(error){
        console.error("Registration error : ", error.code || error.message);

        // MySQL duplicate-key error
        if(error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success : false,
                error: {
                code : "DUPLICATE_ENTRY",
                message : "Email, phone number, or username is already registered."
                }
            });
        }

        return res.status(500).json({
            success: false,
            error: {
                code: "REGISTRATION_FAILED",
                message : "Unable to register user at this time."
            }
        });
    }
}

async function login(req, res){
    try{
        const {username, password} = req.body;

        const user = await authService.loginUser(username, password);

        if(!user){
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_CREDENTAILS",
                    message: "Invalid username or password."
                }
            });
        }

        // Generate an access token only after successful authentication.
        const accessToken = tokenService.generateAccessToken(user);

        const session = await sessionService.createSessionForUser(user.user_id);

        return res.status(200).json({
            success : true,
            message : "Login successful.",
            data: {user,
                accessToken,
                refreshToken: session.refreshToken,
                tokenType: "Bearer",
                expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
                refreshTokenExpiresAt: session.expiresAt
            }
        });
    } catch (error){
         console.error("Login error details:", {
        code: error.code,
        message: error.message,
        sqlMessage: error.sqlMessage
    });

        return res.status(500).json({
            success: false,
            error: {
                code: "LOGIN_FAILED",
                message: "Unable to log in at this time."
            }
        });
    }
}

async function refresh(req, res) {
    try{
        const {refreshToken} = req.body;

        if(typeof refreshToken !== "string"  || !refreshToken) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "REFRESH_TOKEN_REQUIRED",
                    message: "Refresh token is required."
                }
            });
        }

        const session = await sessionService.rotateRefreshToken(refreshToken);
        
        if(!session){
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_REFRESH_TOKEN",
                    message: "Refresh token is invalid, expired, or revoked."
                }
            });
        }

        const accessToken = tokenService.generateAccessToken({
            user_id: session.userId,
            username: session.username
        });

        return res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully.",
            data: {
                accessToken,
                refreshToken: session.refreshToken,
                tokenType: "Bearer",
                expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
                refreshTokenExpiresAt : session.expiresAt
            }
        });
    } catch(error){
        console.error("Refresh token error: ", error.message);
        
        return res.status(500).json({
            success: false,
            error: {
                code: "TOKEN_REFRESH_FAILED",
                message: "Unable to refresh token at this time."
            }
        });
    }
}

async function logout(req,res) {
    try{
        const {refreshToken } = req.body;

        if(typeof refreshToken !== "string" || !refreshToken.trim()){
            return res.status(400).json({
                success: false,
                error: {
                    code: "REFRESH_TOKEN_REQUIRED",
                    message: "Refresh token is required."
                }
            });
        }

        const session = await sessionService.findActiveSession(refreshToken);

        if(!session){
            return res.status(401).json({
                success: false,
                error: {
                    code: "INVALID_REFRESH_TOKEN",
                    message: "Refresh token is invalid, expired, or revoked."
                }
            });
        }

        const revoked = await sessionService.revokeSession(session.session_id);

        if(!revoked) {
            return res.status(401).json({
                success: false,
                error: {
                    code: "SESSION_ALREADY_REVOKED",
                    message: "The session is no longer active."
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: "Logout successful."
        });
    } catch(error){
        console.error("Logout error: ", error.message);
        
        return res.status(500).json({
            success: false,
            error: {
                code: "LOGOUT_FAILED",
                message: "Unable to log out at this time."
            }
        });
    }
}

module.exports = { register, login, refresh, logout };