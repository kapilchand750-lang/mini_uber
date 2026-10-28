const jwt = require("jsonwebtoken");

function generateAccessToken(user) {
    const secret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";

    if(!secret || secret === "replace_with_a_random_secret") {
        throw new Error("JWT access secret is not configured.");
    }

    return jwt.sign({
        sub: String(user.user_id),
        username: user.username
    },
secret,
{
    expiresIn,
    algorithm: "HS256"
}
);
}

function verifyAccessToken(token){
    return jwt.verify(
        token, 
        process.env.JWT_ACCESS_SECRET,
        {
            algorithms: ["HS256"]
        }
    );
}

module.exports = {
    generateAccessToken,
    verifyAccessToken
};
