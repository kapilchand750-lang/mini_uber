const express = require("express");

const authRoutes = require("./modules/auth/routes/auth.routes");
const userRoutes = require("./modules/users/routes/user.routes");
const driverRoutes = require("./modules/drivers/routes/driver.routes");

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());

// Feature routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drivers", driverRoutes);

// Health check
app.get("/api/test", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Mini Uber Backend is working."
    });
});

app.listen(PORT, () => {
    console.log(`Mini Uber server running on port ${PORT}`);
});
