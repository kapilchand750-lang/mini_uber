const userService = require("../services/user.service");

async function getProfile(req, res) {
    try{
        const userId = req.user.user_id;
        const profile = await userService.getProfile(userId);

        return res.status(200).json({
            success: true,
            message: "User profile retrieved successfully.",
            data: {
                user: profile
            }
        });
    } catch(error) {
        if(error.code === "USER_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User profile not found."
                }
            });
        }

        console.error("Get user profile error:", error.message);

        return res.status(500).json({
            success: false,
            error: {
                code: "PROFILE_FETCH_FAILED",
                message: "Unable to retrieve user profile at this time."
            }
        });
    }
}

async function updateProfile(req, res){
    try{
        const userId = req.user.user_id;

        const profileData = {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone
        };

        const updateProfile = await userService.updateProfile(userId, profileData);

        return res.status(200).json({
            success: true,
            message: "User profile updated successfully.",
            data: {
                user: updateProfile
            }
        });
    } catch (error) {
        if(error.code === "USER_NOT_FOUND"){
            return res.status(404).json({
                success: false,
                error: {
                    code: "USER_NOT_FOUND",
                    message: "User profile not found."
                }
            });
        }

        if(error.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                success: false,
                error: {
                    code: "DUPLICATTE_PROFILE_FIELD",
                    message: "The email or phone number is already registered."
                }
            });
        }

        console.error("Update user profile error:", error.message);

        return res.status(500).json({
            success: false,
            error: {
                code: "PROFILE_UPDATE_FAILED",
                message: "Unable to update user profile at this time."
            }
        });
    }
}

module.exports = {
    getProfile,
    updateProfile
};