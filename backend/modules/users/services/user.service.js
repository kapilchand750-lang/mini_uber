const userRepository = require("../repositories/user.repository");

async function getProfile(userId) {
    const profile = await userRepository.findProfileByUserId(userId);

    if(!profile) {
        const error = new Error("User profile not found.");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    return profile;
}

module.exports = {
    getProfile
};