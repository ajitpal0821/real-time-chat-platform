const { io } = require("socket.io-client");

const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YTljNWQ4NWUzNmRlNDE0MDc5YTQ2NWIiLCJpYXQiOjE3ODg3NzY3ODAsImV4cCI6MTc4ODc4MDMyMH0.5MTDIslXlHbHClkC9NnjrTyHthSgXVI7rSMiAzgu6EU";
const roomId = "6a9c5e150863a8a2ebd5b588";

if (accessToken === "YOUR_ACCESS_TOKEN") {
    throw new Error("Set accessToken to a JWT returned by the login API before running this test.");
}

const socket = io("http://localhost:3000", {
    auth: {
        token: accessToken
    }
});

socket.on("connect", () => {

    console.log("Connected:", socket.id);

    // Join room
    socket.emit(
        "join_room",
        { roomId },
        (response) => {
            console.log("Join response:", response);

            // Send message AFTER joining
            socket.emit(
                "send_message",
                {
                    roomId,
                    content: "Hello from User test!",
                    messageType: "text"
                },
                (response) => {
                    console.log("Send response:", response);
                }
            );
        }
    );
});


socket.on("new_message", (message) => {
    console.log("New message:", message);
});


socket.on("user_joined", (data) => {
    console.log("User joined:", data);
});


socket.on("user_left", (data) => {
    console.log("User left:", data);
});


socket.on("user_typing", (data) => {
    console.log("User typing:", data);
});


socket.on("user_stopped_typing", (data) => {
    console.log("User stopped typing:", data);
});


socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error.message);
});