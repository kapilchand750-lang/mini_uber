const tokenService = require("../services/token.service");

function authenticateToken(req, res, next){
    const authorizationHeader = req.headers.authorization;

    if(!authorizationHeader){
        return res.status(401).json({
            success: false,
            error: {
                code: "ACCESS_TOKEN_REQUIRED",
                message: "Access token is required."
            }
        });
    }

    const [tokenType, token] = authorizationHeader.split(" ");

    if(tokenType !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_AUTHORIZATION_HEADER",
                message: "Use the Bearer token format."
            }
        });
    }

    try {
        const decoded = tokenService.verifyAccessToken(token);

        req.user = {
            user_id: Number(decoded.sub),
            username: decoded.username
        };

        next();
    } catch(error){
         console.error("JWT verification failed:", error.name, error.message);
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_OR_EXPIRED_TOKEN",
                message: "Access token is invalid or expired."
            }
        });
    }
}

module.exports = {
    authenticateToken
};