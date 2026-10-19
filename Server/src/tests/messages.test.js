const request = require('supertest');
const app = require('../app');

describe('Stage 4: Messages Integration Suite', () => {

    let ownerToken, ownerId;
    let memberToken, memberId;
    let outsiderToken, outsiderId;
    let roomId;

    beforeEach(async () => {
        // 1. Create Room Owner / Author
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Message Author',
            email: 'author@pulsechat.test',
            password: 'Password123'
        });
        ownerId = ownerRes.body.response.data._id;
        const ownerLogin = await request(app).post('/api/auth/login').send({
            email: 'author@pulsechat.test',
            password: 'Password123'
        });
        ownerToken = ownerLogin.body.response.data.accessToken;

        // 2. Create Regular Member
        const memberRes = await request(app).post('/api/auth/register').send({
            name: 'Room Reader',
            email: 'reader@pulsechat.test',
            password: 'Password123'
        });
        memberId = memberRes.body.response.data._id;
        const memberLogin = await request(app).post('/api/auth/login').send({
            email: 'reader@pulsechat.test',
            password: 'Password123'
        });
        memberToken = memberLogin.body.response.data.accessToken;

        // 3. Create Outsider (non-member)
        const outsiderRes = await request(app).post('/api/auth/register').send({
            name: 'Outsider User',
            email: 'outsider@pulsechat.test',
            password: 'Password123'
        });
        outsiderId = outsiderRes.body.response.data._id;
        const outsiderLogin = await request(app).post('/api/auth/login').send({
            email: 'outsider@pulsechat.test',
            password: 'Password123'
        });
        outsiderToken = outsiderLogin.body.response.data.accessToken;

        // 4. Create Channel (< 20 chars to comply with schema)
        const roomRes = await request(app)
            .post('/api/rooms')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ name: 'General Chat' });
        roomId = roomRes.body.response.data._id;

        // 5. Member joins room
        await request(app)
            .post(`/api/rooms/${roomId}/join`)
            .set('Authorization', `Bearer ${memberToken}`);
    });

    // =========================================================================
    // 1. SEND MESSAGE TESTS
    // =========================================================================
    describe('POST /api/rooms/:roomId/messages - Send Message', () => {

        it('should allow a room member to send a text message', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    content: 'Hello PulseChat world!'
                });

            expect(res.status).toBe(201);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.message).toBe('Message sent successfully');
            expect(res.body.response.data).toHaveProperty('_id');
            expect(res.body.response.data.content).toBe('Hello PulseChat world!');
            expect(res.body.response.data.messageType).toBe('text');
            expect(res.body.response.data.senderId).toHaveProperty('name', 'Message Author');
        });

        it('should deny non-members from sending messages with 403 ROOM_ACCESS_DENIED', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${outsiderToken}`)
                .send({
                    content: 'Intruder message'
                });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('ROOM_ACCESS_DENIED');
        });

        it('should reject empty message content with 400 validation error', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    content: '   '
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject unauthenticated request with 401 UNAUTHORIZED', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .send({
                    content: 'No token message'
                });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    // =========================================================================
    // 2. LIST MESSAGES & PAGINATION
    // =========================================================================
    describe('GET /api/rooms/:roomId/messages - List Messages & Pagination', () => {

        beforeEach(async () => {
            // Seed 3 sequential messages
            await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'Message 1' });

            await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ content: 'Message 2' });

            await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'Message 3' });
        });

        it('should allow room members to fetch message history', async () => {
            const res = await request(app)
                .get(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(Array.isArray(res.body.response.data)).toBe(true);
            expect(res.body.response.data).toHaveLength(3);

            // Verified sort order: newest message first (createdAt: -1)
            expect(res.body.response.data[0].content).toBe('Message 3');
            expect(res.body.response.data[2].content).toBe('Message 1');
        });

        it('should support pagination with limit query parameter', async () => {
            const res = await request(app)
                .get(`/api/rooms/${roomId}/messages?limit=2`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.data).toHaveLength(2);
            expect(res.body.response.data[0].content).toBe('Message 3');
            expect(res.body.response.data[1].content).toBe('Message 2');
        });

        it('should support cursor pagination with before parameter', async () => {
            const listRes = await request(app)
                .get(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${memberToken}`);

            const middleMessage = listRes.body.response.data[1]; // Message 2
            const cursor = middleMessage.createdAt;

            const pagedRes = await request(app)
                .get(`/api/rooms/${roomId}/messages?before=${cursor}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(pagedRes.status).toBe(200);
            // Only messages created before Message 2 should be returned (Message 1)
            expect(pagedRes.body.response.data).toHaveLength(1);
            expect(pagedRes.body.response.data[0].content).toBe('Message 1');
        });

        it('should deny non-members with 403 ROOM_ACCESS_DENIED', async () => {
            const res = await request(app)
                .get(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('ROOM_ACCESS_DENIED');
        });
    });

    // =========================================================================
    // 3. UPDATE / EDIT MESSAGE (OWNERSHIP PERMISSION)
    // =========================================================================
    describe('PATCH /api/rooms/:roomId/messages/:messageId - Edit Message', () => {

        let messageId;

        beforeEach(async () => {
            const sendRes = await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'Original text' });
            messageId = sendRes.body.response.data._id;
        });

        it('should allow author to edit their own message', async () => {
            const res = await request(app)
                .patch(`/api/rooms/${roomId}/messages/${messageId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'Edited text content' });

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data.content).toBe('Edited text content');
        });

        it('should reject editing someone else\'s message with 403 MESSAGE_EDIT_FORBIDDEN', async () => {
            // Member tries to edit Owner's message
            const res = await request(app)
                .patch(`/api/rooms/${roomId}/messages/${messageId}`)
                .set('Authorization', `Bearer ${memberToken}`)
                .send({ content: 'Malicious edit attempt' });

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('MESSAGE_EDIT_FORBIDDEN');
        });

        it('should return 404 MESSAGE_NOT_FOUND for non-existent message ID', async () => {
            const fakeMessageId = '507f191e810c19729de860ea';
            const res = await request(app)
                .patch(`/api/rooms/${roomId}/messages/${fakeMessageId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'Updating ghost message' });

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('MESSAGE_NOT_FOUND');
        });
    });

    // =========================================================================
    // 4. DELETE MESSAGE (OWNERSHIP PERMISSION)
    // =========================================================================
    describe('DELETE /api/rooms/:roomId/messages/:messageId - Delete Message', () => {

        let messageId;

        beforeEach(async () => {
            const sendRes = await request(app)
                .post(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ content: 'To be deleted' });
            messageId = sendRes.body.response.data._id;
        });

        it('should allow author to delete their own message', async () => {
            const res = await request(app)
                .delete(`/api/rooms/${roomId}/messages/${messageId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.message).toBe('Message deleted successfully');

            // Verify message is no longer in message history
            const listRes = await request(app)
                .get(`/api/rooms/${roomId}/messages`)
                .set('Authorization', `Bearer ${ownerToken}`);

            const ids = listRes.body.response.data.map(m => m._id);
            expect(ids).not.toContain(messageId);
        });

        it('should reject deleting someone else\'s message with 403 MESSAGE_DELETE_FORBIDDEN', async () => {
            // Member tries to delete Owner's message
            const res = await request(app)
                .delete(`/api/rooms/${roomId}/messages/${messageId}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('MESSAGE_DELETE_FORBIDDEN');
        });

        it('should return 404 MESSAGE_NOT_FOUND when deleting non-existent message', async () => {
            const fakeMessageId = '507f191e810c19729de860ea';
            const res = await request(app)
                .delete(`/api/rooms/${roomId}/messages/${fakeMessageId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('MESSAGE_NOT_FOUND');
        });
    });

});
