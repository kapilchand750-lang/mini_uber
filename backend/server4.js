const express = require("express")

const app = express();

const PORT = 4000;

app.get("/api/test", (req, res) => {
    res.json({
        msg : "Mini Uber Backend is Working"
    })
})

app.listen(PORT, ()=> {
    console.log(`Mini uber server running on port ${PORT}`);
});