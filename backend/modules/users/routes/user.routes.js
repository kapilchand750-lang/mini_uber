const express = require("express");

const userController = require("../controllers/user.controller");

const {authenticateToken} = require("../../../middleware/auth.middleware");

const router = express.Router();

router.get("/me", authenticateToken, userController.getProfile);

module.exports = router;