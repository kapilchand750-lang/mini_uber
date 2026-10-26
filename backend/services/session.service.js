const refreshTokenService = require("./refresh-token.service");
const sessionRepository = require("../repositories/session.repository");
const authRepository = require("../repositories/auth.repository");

const REFRESH_TOKEN_LIFETIME_DAYS = 7;

function calculateExpiryDate(){
    const expiresAt = new Date();
    expiresAt.setUTCDate(
        expiresAt.getUTCDate() + REFRESH_TOKEN_LIFETIME_DAYS
    );

    return expiresAt;
}

async function createSessionForUser(userId) {
    if(!Number.isInteger(userId) || userId <= 0){
        throw new Error("A valid user ID is required");
    }

    const refreshToken = refreshTokenService.generateRefreshToken();
    const refreshTokenHash = refreshTokenService.hashRefreshToken(refreshToken);

    const expiresAt = calculateExpiryDate();

    const session = await sessionRepository.createSession(userId, refreshTokenHash, expiresAt);

    return{
        sessionId: session.session_id,
        refreshToken,
        expiresAt: session.expires_at
    };
}

async function findActiveSession(refreshToken){
    const refreshTokenHash = refreshTokenService.hashRefreshToken(refreshToken);

    return sessionRepository.findActiveSessionByTokenHash(refreshTokenHash);
} 

async function rotateRefreshToken(refreshToken){
    if(typeof refreshToken !== "string" || refreshToken.length === 0)
        return null;

    const oldTokenHash = refreshTokenService.hashRefreshToken(refreshToken);

    const oldSession = await sessionRepository.findActiveSessionByTokenHash(oldTokenHash);

    if(!oldSession) return null;

    const user = await authRepository.findByUserId(oldSession.user_id);

    if(!user) return null;

    const newRefreshToken = refreshTokenService.generateRefreshToken();
    const newTokenHash = refreshTokenService.hashRefreshToken(newRefreshToken);

    const expiresAt = calculateExpiryDate();

    const newSession = await sessionRepository.rotateSession(oldSession, oldTokenHash, newTokenHash, expiresAt);

    return{
        sessionId: newSession.session_id,
        userId: newSession.user_id,
        username: user.username,
        refreshToken: newRefreshToken,
        expiresAt: newSession.expires_at
    };
}

async function revokeSession(sessionId){
    return sessionRepository.revokeSession(sessionId);
}

module.exports = {
    createSessionForUser,
    findActiveSession,
    revokeSession,
    rotateRefreshToken
}