const express = require("express");

const adminController = require("../controllers/admin.controller");
const {authenticateToken} = require("../../../middleware/auth.middleware");
const {requireAdmin} = require("../../../middleware/admin.middleware");

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/driver-applications", adminController.getDriverApplications);
router.get("/driver-applications/:driverUserId", adminController.getDriverApplication);
router.patch("/driver-applications/:driverUserId", adminController.reviewDriverApplication);

module.exports = router;
