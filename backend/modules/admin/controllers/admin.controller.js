const adminService = require("../services/admin.service");

async function getDriverApplications(req, res) {
    try{
        const status = (req.query.status || "PENDING").trim().toUpperCase();

        const applications = await adminService.getDriverApplications(status);

        return res.status(200).json({
            success: true,
            message: "Driver applications fetched successfully.",
            data: applications
        });
    } catch (error) {
        console.error("Get driver applications error: ", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error.",
            code: error.code || "INTERNAL_SERVER_ERROR"
        });
    }
}

async function getDriverApplication(req, res){
    try {
        const driverUserId = Number(req.params.driverUserId);

        const application = await adminService.getDriverApplicationById(driverUserId);

        return res.status(200).json({
            success: true,
            message: "Driver application fetched successfully.",
            data: application
        });
    } catch (error) {
        console.error("Get driver application error: ", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error.",
            code: error.code || "INTERNAL_SERVER_ERROR"
        });
    }
}

async function reviewDriverApplication(req, res){
    try{
        const driverUserId = Number(req.params.driverUserId);
        const applicationStatus = req.body.applicationStatus?.trim().toUpperCase();

        const applications = await adminService.reviewDriverApplication(driverUserId, applicationStatus);
        return res.status(200).json({
            success: true,
            message: "Driver application reviewed successfully.",
            data: applications
        });

    } catch(error) {
        console.error("Review driver application error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error.",
            code: error.code || "INTERNAL_SERVER_ERROR"
        });
    }
}

module.exports = {
    getDriverApplications,
    getDriverApplication,
    reviewDriverApplication
}
