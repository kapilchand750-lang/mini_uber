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

module.exports = {
    getProfile
};