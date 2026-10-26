const express = require("express");
const {validateRegister, validateLogin } = require("../validators/auth.validator");
const authController = require("../controllers/auth.controller");

const router = express.Router();

// POST /api/auth/register
router.post("/register", validateRegister, authController.register);

// Login endpoint
router.post("/login", validateLogin, authController.login);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

module.exports = router;
