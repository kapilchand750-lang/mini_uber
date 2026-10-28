const express = require("express");

const vehicleController = require("../controllers/vehicle.controller");
const { authenticateToken } = require("../../../middleware/auth.middleware");
const {validateVehicle} = require("../validators/vehicle.validator");

const router = express.Router();

// Register a vehicle
router.post("/", authenticateToken, validateVehicle, vehicleController.register);

// Get all vehicles belonging to the authenticated driver
router.get("/", authenticateToken, vehicleController.getMyVehicles);

// Get one vehicle belonging to the authenticated driver
router.get("/:vehicleId", authenticateToken, vehicleController.getMyVehicle);

// Update a vehicle belonging to the authenticated driver
router.put("/:vehicleId", authenticateToken, validateVehicle, vehicleController.update);

// Delete a vehicle belonging to the authenticated driver
router.delete("/:vehicleId", authenticateToken, vehicleController.remove);

module.exports = router;
