const express = require("express");

const userController = require("../controllers/user.controller");
const {authenticateToken} = require("../../../middleware/auth.middleware");
const { validateUpdateProfile } = require("../validators/user.validator");

const router = express.Router();

router.get("/me", authenticateToken, userController.getProfile);

router.put("/me", authenticateToken, validateUpdateProfile, userController.updateProfile);

module.exports = router;