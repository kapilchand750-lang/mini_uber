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

async function updateProfile(userId, profileData){
    const existingProfile = await userRepository.findProfileByUserId(userId);

    if(!existingProfile) {
        const error = new Error("User profile not found.");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
    }

    await userRepository.updateProfile(userId, profileData);

    return await userRepository.findProfileByUserId(userId);
}

module.exports = {
    getProfile,
    updateProfile
};