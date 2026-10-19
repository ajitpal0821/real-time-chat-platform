const express = require('express');
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit')
const { sanitize } = require('express-mongo-sanitize');

const app = express();
// const jsonParser = express.json();

// for setting security headers
app.use(helmet());


const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:4200"]
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,

})
// app.use('/api', globalLimiter);


const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 100,
    message: "Too many attempts from this IP, please try again after 1 hour",

})
if (process.env.NODE_ENV !== 'test') {
    app.use('/api', globalLimiter);
    app.use('/api/auth', authLimiter);
}
app.use(express.json({ limit: '10kb' }));


// app.use(mongoSanitize())

// Express 5 compatible NoSQL sanitization (modifies in-place without reassigning req.query)
app.use((req, res, next) => {
    if (req.body) sanitize(req.body);
    if (req.params) sanitize(req.params);
    if (req.query) sanitize(req.query);
    next();
});



app.use("/api/users", require("./routes/user.routes.js"));
app.use(
    "/api/auth",
    require("./routes/auth.routes.js")
);

app.use("/api/rooms/:roomId/messages", require("./routes/message.routes.js"))
app.use(
    "/api/rooms",
    require("./routes/room.routes")
);
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" })
})



app.use(require("./middleware/error.middleware.js"));

module.exports = app;