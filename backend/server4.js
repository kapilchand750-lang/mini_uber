const express = require("express");
const db = require("./config/db");
const authRoutes = require("./modules/auth/routes/auth.routes");
const {authenticateToken} = require("./middleware/auth.middleware");
const app = express();
const PORT = 4000;

// Parse incoming JSON request bodies
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

app.get("/api/test", (req, res) => {
    res.status(200).json({
        msg : "Mini Uber Backend is Working"
    })
})

//MySQL connection test
app.get("/api/db-test", (req, res) => {
    db.query("SELECT 1 AS result", (err, results) => {
        if(err){
            console.error("Database test failed : ", err.message);

            return res.status(500).json({
                message : "Database connection failed"
            });
        }

        res.status(200).json({
            msg : "Database connection succesful",
            result : results[0].result
        });
    });
});

// Check tables in the selected database
app.get("/api/db-tables", (req, res) => {
    db.query("SHOW TABLES", (err, results) => {
        if (err) {
            console.error("Failed to fetch tables:", err.message);

            return res.status(500).json({
                message: "Could not fetch database tables"
            });
        }

        res.status(200).json({
            message: "Tables fetched successfully",
            count: results.length,
            tables: results
        });
    });
});

app.get("/api/test-protected", authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "You accessed a protected endpoint.",
        data: {
            user: req.user
        }
    });
});

console.log("Registered routes: /api/test, /api/db-test");

app.listen(PORT, ()=> {
    console.log(`Mini uber server running on port ${PORT}`);
});