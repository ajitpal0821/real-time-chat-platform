const request = require('supertest');
const app = require('../app');

describe('Stage 3: Rooms Integration Suite', () => {

    let ownerToken, ownerId;
    let memberToken, memberId;
    let outsiderToken, outsiderId;

    beforeEach(async () => {
        // 1. Create Room Owner
        const ownerRes = await request(app).post('/api/auth/register').send({
            name: 'Room Owner',
            email: 'owner@pulsechat.test',
            password: 'Password123'
        });
        ownerId = ownerRes.body.response.data._id;
        const ownerLogin = await request(app).post('/api/auth/login').send({
            email: 'owner@pulsechat.test',
            password: 'Password123'
        });
        ownerToken = ownerLogin.body.response.data.accessToken;

        // 2. Create Regular Member
        const memberRes = await request(app).post('/api/auth/register').send({
            name: 'Room Member',
            email: 'member@pulsechat.test',
            password: 'Password123'
        });
        memberId = memberRes.body.response.data._id;
        const memberLogin = await request(app).post('/api/auth/login').send({
            email: 'member@pulsechat.test',
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
    });

    // =========================================================================
    // 1. ROOM CREATION TESTS
    // =========================================================================
    describe('POST /api/rooms - Create Room', () => {

        it('should successfully create a public room and assign creator as owner', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'General Discussion',
                    description: 'Public chat room for everyone',
                    isPrivate: false
                });

            expect(res.status).toBe(201);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data).toHaveProperty('_id');
            expect(res.body.response.data.name).toBe('General Discussion');
            expect(res.body.response.data.isPrivate).toBe(false);
            expect(res.body.response.data.ownerId).toBe(ownerId);
        });

        it('should successfully create a private room', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'Secret Strategy',
                    description: 'Confidential channel',
                    isPrivate: true
                });

            expect(res.status).toBe(201);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data.isPrivate).toBe(true);
        });

        it('should reject room creation with invalid payload (name < 2 chars)', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    name: 'A'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject room creation without authentication', async () => {
            const res = await request(app)
                .post('/api/rooms')
                .send({
                    name: 'Unauthorized Room'
                });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    // =========================================================================
    // 2. GET USER ROOMS (MY ROOMS)
    // =========================================================================
    describe('GET /api/rooms - Get My Rooms', () => {

        it('should return list of rooms where the user is a member', async () => {
            // Owner creates a room
            const createRes = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'NodeJS Enthusiasts' });

            const roomId = createRes.body.response.data._id;

            // Owner fetches their rooms
            const ownerRoomsRes = await request(app)
                .get('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(ownerRoomsRes.status).toBe(200);
            expect(ownerRoomsRes.body.response.success).toBe(true);
            expect(Array.isArray(ownerRoomsRes.body.response.data)).toBe(true);
            const roomIds = ownerRoomsRes.body.response.data.map(r => r._id || r.toString());
            expect(roomIds).toContain(roomId);

            // Outsider should have empty rooms
            const outsiderRoomsRes = await request(app)
                .get('/api/rooms')
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(outsiderRoomsRes.status).toBe(200);
            expect(outsiderRoomsRes.body.response.data).toHaveLength(0);
        });
    });

    // =========================================================================
    // 3. GET ROOM DETAILS & ACCESS CONTROL
    // =========================================================================
    describe('GET /api/rooms/:roomId - Access Control', () => {

        let publicRoomId;

        beforeEach(async () => {
            const createRes = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Architecture' });
            publicRoomId = createRes.body.response.data._id;
        });

        it('should allow room members to fetch room details', async () => {
            const res = await request(app)
                .get(`/api/rooms/${publicRoomId}`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data._id).toBe(publicRoomId);
            expect(res.body.response.data.name).toBe('Architecture');
        });

        it('should deny non-members with 403 ROOM_ACCESS_DENIED', async () => {
            const res = await request(app)
                .get(`/api/rooms/${publicRoomId}`)
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('ROOM_ACCESS_DENIED');
        });
    });

    // =========================================================================
    // 4. JOIN ROOMS
    // =========================================================================
    describe('POST /api/rooms/:roomId/join - Join Room', () => {

        let publicRoomId;
        let privateRoomId;

        beforeEach(async () => {
            const pubRes = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Public Lobby', isPrivate: false });
            publicRoomId = pubRes.body.response.data._id;

            const privRes = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'VIP Lounge', isPrivate: true });
            privateRoomId = privRes.body.response.data._id;
        });

        it('should allow a user to join a public room', async () => {
            const res = await request(app)
                .post(`/api/rooms/${publicRoomId}/join`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(201);
            expect(res.body.response.success).toBe(true);

            // Member can now access room details
            const detailsRes = await request(app)
                .get(`/api/rooms/${publicRoomId}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(detailsRes.status).toBe(200);
        });

        it('should reject joining a private room with 403 PRIVATE_ROOM', async () => {
            const res = await request(app)
                .post(`/api/rooms/${privateRoomId}/join`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('PRIVATE_ROOM');
        });

        it('should reject joining if user is already a member with 409 ALREADY_MEMBER', async () => {
            // Owner is already a member
            const res = await request(app)
                .post(`/api/rooms/${publicRoomId}/join`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(409);
            expect(res.body.error.code).toBe('ALREADY_MEMBER');
        });

        it('should return 404 ROOM_NOT_FOUND when joining non-existent room', async () => {
            const fakeRoomId = '507f1f77bcf86cd799439011';
            const res = await request(app)
                .post(`/api/rooms/${fakeRoomId}/join`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('ROOM_NOT_FOUND');
        });
    });

    // =========================================================================
    // 5. ROOM MEMBERS
    // =========================================================================
    describe('GET /api/rooms/:roomId/members - Get Members', () => {

        let roomId;

        beforeEach(async () => {
            const pubRes = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Dev Team' });
            roomId = pubRes.body.response.data._id;

            // Member joins the room
            await request(app)
                .post(`/api/rooms/${roomId}/join`)
                .set('Authorization', `Bearer ${memberToken}`);
        });

        it('should allow members to view the list of room members with user details', async () => {
            const res = await request(app)
                .get(`/api/rooms/${roomId}/members`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(Array.isArray(res.body.response.data)).toBe(true);
            expect(res.body.response.data).toHaveLength(2);

            const roles = res.body.response.data.map(m => m.role);
            expect(roles).toContain('owner');
            expect(roles).toContain('member');

            // Verify populated fields
            const ownerMember = res.body.response.data.find(m => m.role === 'owner');
            expect(ownerMember.userId).toHaveProperty('name', 'Room Owner');
            expect(ownerMember.userId).toHaveProperty('email', 'owner@pulsechat.test');
        });

        it('should deny outsiders from viewing members with 403 ROOM_ACCESS_DENIED', async () => {
            const res = await request(app)
                .get(`/api/rooms/${roomId}/members`)
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error.code).toBe('ROOM_ACCESS_DENIED');
        });
    });

    // =========================================================================
    // 6. LEAVING ROOMS
    // =========================================================================
    describe('POST /api/rooms/:roomId/leave - Leave Room', () => {

        let roomId;

        beforeEach(async () => {
            const pubRes = await request(app)
                .post('/api/rooms')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ name: 'Gaming Zone' });
            roomId = pubRes.body.response.data._id;

            await request(app)
                .post(`/api/rooms/${roomId}/join`)
                .set('Authorization', `Bearer ${memberToken}`);
        });

        it('should allow a regular member to leave the room successfully', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/leave`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);

            // Member should now be denied access to the room
            const checkRes = await request(app)
                .get(`/api/rooms/${roomId}`)
                .set('Authorization', `Bearer ${memberToken}`);

            expect(checkRes.status).toBe(403);
            expect(checkRes.body.error.code).toBe('ROOM_ACCESS_DENIED');
        });

        it('should reject owner from leaving the room with 400 OWNER_CANNOT_LEAVE', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/leave`)
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error.code).toBe('OWNER_CANNOT_LEAVE');
        });

        it('should return 404 ROOM_MEMBERSHIP_NOT_FOUND when non-member tries to leave', async () => {
            const res = await request(app)
                .post(`/api/rooms/${roomId}/leave`)
                .set('Authorization', `Bearer ${outsiderToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error.code).toBe('ROOM_MEMBERSHIP_NOT_FOUND');
        });
    });

});
