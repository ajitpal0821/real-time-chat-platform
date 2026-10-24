const http = require('http');
const request = require('supertest');
const Client = require('socket.io-client');
const app = require('../app');
const { initSocket } = require('../sockets');

describe('Stage 5: Socket.IO Real-Time Integration Suite', () => {

    let httpServer;
    let io;
    let port;
    let activeSockets = [];

    // Test Users & Credentials
    let userA, tokenA, userIdA;
    let userB, tokenB, userIdB;
    let userC, tokenC, userIdC;

    // Test Rooms
    let roomAId;
    let roomBId;

    // Helper: Connect a client socket with Promise resolution
    const createClientSocket = (token) => {
        const socket = Client(`http://localhost:${port}`, {
            auth: { token },
            transports: ['websocket'],
            forceNew: true,
            reconnection: false
        });
        activeSockets.push(socket);
        return socket;
    };

    const connectSocket = (socket, timeout = 4000) => {
        return new Promise((resolve, reject) => {
            if (socket.connected) return resolve(socket);
            const timer = setTimeout(() => {
                reject(new Error('Socket connection timed out'));
            }, timeout);

            socket.once('connect', () => {
                clearTimeout(timer);
                resolve(socket);
            });

            socket.once('connect_error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    };

    const emitWithAck = (socket, event, data, timeout = 4000) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for ack on ${event}`));
            }, timeout);

            socket.emit(event, data, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    };

    const waitForEvent = (socket, eventName, timeout = 4000) => {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Timeout waiting for event: ${eventName}`));
            }, timeout);

            socket.once(eventName, (data) => {
                clearTimeout(timer);
                resolve(data);
            });
        });
    };

    beforeAll(async () => {
        // 1. Initialize HTTP Server with dynamic port
        httpServer = http.createServer(app);
        io = await initSocket(httpServer);

        await new Promise((resolve) => {
            httpServer.listen(0, () => {
                port = httpServer.address().port;
                resolve();
            });
        });
    });

    afterAll(async () => {
        // Clean up all active sockets
        for (const s of activeSockets) {
            try {
                s.disconnect();
            } catch (err) {}
        }
        activeSockets = [];

        // Close Socket.IO server & HTTP server
        if (io) {
            await io.close();
        }
        if (httpServer) {
            await new Promise((resolve) => httpServer.close(resolve));
        }
    });

    beforeEach(async () => {
        // Register & Authenticate User A (Owner of Room A)
        userA = {
            name: 'Alice Socket',
            email: 'alice.socket@pulsechat.test',
            password: 'Password123'
        };
        const regARes = await request(app).post('/api/auth/register').send(userA);
        userIdA = regARes.body.response.data._id;
        const loginARes = await request(app).post('/api/auth/login').send({
            email: userA.email,
            password: userA.password
        });
        tokenA = loginARes.body.response.data.accessToken;

        // Register & Authenticate User B (Member of Room A, Member of Room B)
        userB = {
            name: 'Bob Socket',
            email: 'bob.socket@pulsechat.test',
            password: 'Password123'
        };
        const regBRes = await request(app).post('/api/auth/register').send(userB);
        userIdB = regBRes.body.response.data._id;
        const loginBRes = await request(app).post('/api/auth/login').send({
            email: userB.email,
            password: userB.password
        });
        tokenB = loginBRes.body.response.data.accessToken;

        // Register & Authenticate User C (Only member of Room B / Outsider to Room A)
        userC = {
            name: 'Charlie Socket',
            email: 'charlie.socket@pulsechat.test',
            password: 'Password123'
        };
        const regCRes = await request(app).post('/api/auth/register').send(userC);
        userIdC = regCRes.body.response.data._id;
        const loginCRes = await request(app).post('/api/auth/login').send({
            email: userC.email,
            password: userC.password
        });
        tokenC = loginCRes.body.response.data.accessToken;

        // Create Room A by User A (Bob joins Room A)
        const roomARes = await request(app)
            .post('/api/rooms')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Alpha Channel', isPrivate: false });
        roomAId = roomARes.body.response.data._id;

        await request(app)
            .post(`/api/rooms/${roomAId}/join`)
            .set('Authorization', `Bearer ${tokenB}`);

        // Create Room B by User C (Bob joins Room B)
        const roomBRes = await request(app)
            .post('/api/rooms')
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ name: 'Beta Channel', isPrivate: false });
        roomBId = roomBRes.body.response.data._id;

        await request(app)
            .post(`/api/rooms/${roomBId}/join`)
            .set('Authorization', `Bearer ${tokenB}`);
    });

    afterEach(async () => {
        // Disconnect all sockets opened during test
        for (const s of activeSockets) {
            try {
                s.disconnect();
            } catch (err) {}
        }
        activeSockets = [];
        await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // =========================================================================
    // 1. HANDSHAKE AUTHENTICATION TESTS
    // =========================================================================
    describe('1. Handshake Authentication', () => {

        it('should successfully establish WebSocket connection when valid JWT token is provided', async () => {
            const client = createClientSocket(tokenA);
            await expect(connectSocket(client)).resolves.toBeDefined();
            expect(client.connected).toBe(true);
        });

        it('should reject connection when token is omitted from handshake', async () => {
            const client = createClientSocket(undefined);
            await expect(connectSocket(client)).rejects.toThrow(/Authentication Error - Token not provided/i);
            expect(client.connected).toBe(false);
        });

        it('should reject connection when token is invalid or malformed', async () => {
            const client = createClientSocket('invalid.bearer.token');
            await expect(connectSocket(client)).rejects.toThrow(/INVALID_TOKEN/i);
            expect(client.connected).toBe(false);
        });

    });

    // =========================================================================
    // 2. ROOM JOIN & LEAVE LIFECYCLE
    // =========================================================================
    describe('2. Room Join & Leave Lifecycle', () => {

        it('should allow room member to join room channel with acknowledgment', async () => {
            const client = createClientSocket(tokenA);
            await connectSocket(client);

            const ack = await emitWithAck(client, 'join_room', { roomId: roomAId });

            expect(ack).toBeDefined();
            expect(ack.success).toBe(true);
            expect(ack.message).toContain(`Joined room ${roomAId}`);
        });

        it('should reject join_room with Room_ACCESS_DENIED if user is not a member', async () => {
            // User C is NOT a member of Room A
            const client = createClientSocket(tokenC);
            await connectSocket(client);

            const ack = await emitWithAck(client, 'join_room', { roomId: roomAId });

            expect(ack).toBeDefined();
            expect(ack.success).toBe(false);
            expect(ack.code).toBe('Room_ACCESS_DENIED');
        });

        it('should broadcast user_joined event to other room peers when member joins', async () => {
            // User A is already in Room A
            const clientA = createClientSocket(tokenA);
            await connectSocket(clientA);
            await emitWithAck(clientA, 'join_room', { roomId: roomAId });

            // User B joins Room A
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientB);

            const joinPromise = waitForEvent(clientA, 'user_joined');
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const eventData = await joinPromise;
            expect(eventData).toBeDefined();
            expect(eventData.userId).toBe(userIdB);
            expect(eventData.roomId).toBe(roomAId);
        });

        it('should allow user to leave room and broadcast user_left event', async () => {
            const clientA = createClientSocket(tokenA);
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientA);
            await connectSocket(clientB);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const leavePromise = waitForEvent(clientA, 'user_left');
            const leaveAck = await emitWithAck(clientB, 'leave_room', { roomId: roomAId });

            expect(leaveAck.success).toBe(true);
            const eventData = await leavePromise;
            expect(eventData.userId).toBe(userIdB);
            expect(eventData.roomId).toBe(roomAId);
        });

    });

    // =========================================================================
    // 3. REAL-TIME MESSAGING & ROOM ISOLATION
    // =========================================================================
    describe('3. Real-Time Messaging & Broadcast Isolation', () => {

        it('should broadcast new_message to all connected peers in the room', async () => {
            const clientA = createClientSocket(tokenA);
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientA);
            await connectSocket(clientB);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const messagePromiseB = waitForEvent(clientB, 'new_message');

            const sendAck = await emitWithAck(clientA, 'send_message', {
                roomId: roomAId,
                content: 'Hello everyone in Alpha!',
                messageType: 'text'
            });

            expect(sendAck.success).toBe(true);
            expect(sendAck.message.content).toBe('Hello everyone in Alpha!');

            const receivedMsg = await messagePromiseB;
            expect(receivedMsg._id).toBe(sendAck.message._id);
            expect(receivedMsg.content).toBe('Hello everyone in Alpha!');
            expect(receivedMsg.roomId).toBe(roomAId);
        });

        it('should isolate room broadcasts (message in Room A NOT received by Room B socket)', async () => {
            const clientA = createClientSocket(tokenA); // in Room A
            const clientC = createClientSocket(tokenC); // in Room B
            await connectSocket(clientA);
            await connectSocket(clientC);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientC, 'join_room', { roomId: roomBId });

            let receivedUnexpected = false;
            clientC.on('new_message', () => {
                receivedUnexpected = true;
            });

            // Send in Room A
            await emitWithAck(clientA, 'send_message', {
                roomId: roomAId,
                content: 'Secret alpha message'
            });

            // Wait brief window to verify clientC never received event
            await new Promise((resolve) => setTimeout(resolve, 300));
            expect(receivedUnexpected).toBe(false);
        });

        it('should reject send_message if user is not a room member', async () => {
            // User C attempts to send message to Room A
            const clientC = createClientSocket(tokenC);
            await connectSocket(clientC);

            const ack = await emitWithAck(clientC, 'send_message', {
                roomId: roomAId,
                content: 'Unauthorized message'
            });

            expect(ack.success).toBe(false);
            expect(ack.code).toBe('Room_ACCESS_DENIED');
        });

    });

    // =========================================================================
    // 4. REAL-TIME MESSAGE MUTATIONS (UPDATE & DELETE)
    // =========================================================================
    describe('4. Message Mutations (Update & Delete)', () => {

        let messageId;

        beforeEach(async () => {
            const clientA = createClientSocket(tokenA);
            await connectSocket(clientA);
            await emitWithAck(clientA, 'join_room', { roomId: roomAId });

            const sendAck = await emitWithAck(clientA, 'send_message', {
                roomId: roomAId,
                content: 'Original Content'
            });
            messageId = sendAck.message._id;
        });

        it('should update message content and broadcast message_updated to room peers', async () => {
            const clientA = createClientSocket(tokenA);
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientA);
            await connectSocket(clientB);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const updatePromiseB = waitForEvent(clientB, 'message_updated');

            const updateAck = await emitWithAck(clientA, 'update_message', {
                roomId: roomAId,
                messageId,
                content: 'Updated Content via Socket'
            });

            expect(updateAck.success).toBe(true);
            expect(updateAck.message.content).toBe('Updated Content via Socket');

            const eventData = await updatePromiseB;
            expect(eventData._id).toBe(messageId);
            expect(eventData.content).toBe('Updated Content via Socket');
        });

        it('should delete message and broadcast message_deleted to room peers', async () => {
            const clientA = createClientSocket(tokenA);
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientA);
            await connectSocket(clientB);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const deletePromiseB = waitForEvent(clientB, 'message_deleted');

            const deleteAck = await emitWithAck(clientA, 'delete_message', {
                roomId: roomAId,
                messageId
            });

            expect(deleteAck.success).toBe(true);
            expect(deleteAck.messageId).toBe(messageId);

            const eventData = await deletePromiseB;
            expect(eventData.roomId).toBe(roomAId);
            expect(eventData.messageId).toBe(messageId);
            expect(eventData.deletedBy).toBe(userIdA);
        });

    });

    // =========================================================================
    // 5. TYPING INDICATORS
    // =========================================================================
    describe('5. Real-Time Typing Indicators', () => {

        it('should broadcast user_typing to room peers when user starts typing', async () => {
            const clientA = createClientSocket(tokenA);
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientA);
            await connectSocket(clientB);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const typingPromiseB = waitForEvent(clientB, 'user_typing');
            clientA.emit('typing_start', { roomId: roomAId });

            const eventData = await typingPromiseB;
            expect(eventData).toBeDefined();
            expect(eventData.userId).toBe(userIdA);
        });

        it('should broadcast user_stopped_typing to room peers when user stops typing', async () => {
            const clientA = createClientSocket(tokenA);
            const clientB = createClientSocket(tokenB);
            await connectSocket(clientA);
            await connectSocket(clientB);

            await emitWithAck(clientA, 'join_room', { roomId: roomAId });
            await emitWithAck(clientB, 'join_room', { roomId: roomAId });

            const stopTypingPromiseB = waitForEvent(clientB, 'user_stopped_typing');
            clientA.emit('typing_stop', { roomId: roomAId });

            const eventData = await stopTypingPromiseB;
            expect(eventData).toBeDefined();
            expect(eventData.userId).toBe(userIdA);
        });

    });

    // =========================================================================
    // 6. SOCKET PAYLOAD VALIDATION (Zod Schemas)
    // =========================================================================
    describe('6. Socket Zod Validation & Schema Boundary Enforcement', () => {

        it('should reject join_room when roomId is not a 24-character hex ObjectId', async () => {
            const clientA = createClientSocket(tokenA);
            await connectSocket(clientA);

            const ack = await emitWithAck(clientA, 'join_room', { roomId: 'invalid-id-123' });

            expect(ack).toBeDefined();
            expect(ack.success).toBe(false);
            expect(ack.code).toBe('VALIDATION_ERROR');
        });

        it('should reject send_message when content is empty or whitespace only', async () => {
            const clientA = createClientSocket(tokenA);
            await connectSocket(clientA);
            await emitWithAck(clientA, 'join_room', { roomId: roomAId });

            const ack = await emitWithAck(clientA, 'send_message', {
                roomId: roomAId,
                content: '   '
            });

            expect(ack).toBeDefined();
            expect(ack.success).toBe(false);
            expect(ack.code).toBe('VALIDATION_ERROR');
            expect(ack.message).toMatch(/Message cannot be empty/i);
        });

        it('should reject send_message when extra unexpected keys are passed (strict schema)', async () => {
            const clientA = createClientSocket(tokenA);
            await connectSocket(clientA);
            await emitWithAck(clientA, 'join_room', { roomId: roomAId });

            const ack = await emitWithAck(clientA, 'send_message', {
                roomId: roomAId,
                content: 'Valid content',
                maliciousInjectedField: 'hack'
            });

            expect(ack).toBeDefined();
            expect(ack.success).toBe(false);
            expect(ack.code).toBe('VALIDATION_ERROR');
        });

    });

});
