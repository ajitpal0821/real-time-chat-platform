const express = require('express');

const app = express();
const jsonParser = express.json();

app.use(express.json());

app.use("/api/users",require("./routes/user.routes.js"));
app.use(
    "/api/auth",
    require("./routes/auth.routes.js")
);

app.use("/api/rooms/:roomId/messages",require("./routes/message.routes.js"))
app.use(
    "/api/rooms",
    require("./routes/room.routes")
);
app.get("/health", (req, res) => {
    res.status(200).json({status:"ok"})
})



app.use(require("./middleware/error.middleware.js"));

module.exports = app;