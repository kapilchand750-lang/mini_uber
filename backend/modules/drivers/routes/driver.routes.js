const express = require("express");

const driverController = require("../controllers/driver.controller");
const {authenticateToken} = require("../../../middleware/auth.middleware");
const {validateDriverApplication} = require("../validators/driver.validator");

const router = express.Router();

router.get("/me", authenticateToken, driverController.getProfile);

router.post("/apply", authenticateToken, validateDriverApplication, driverController.applyForDriver);

module.exports = router;
