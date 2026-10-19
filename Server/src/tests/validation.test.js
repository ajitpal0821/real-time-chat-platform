const request = require('supertest');
const app = require('../app');

describe('Stage 2: Zod Validation & Request Sanitization Suite', () => {

    let authToken;
    const validRoomId = '507f1f77bcf86cd799439011';
    const validMessageId = '507f191e810c19729de860ea';

    beforeAll(async () => {
        // Create user and obtain valid JWT token for protected route validation
        const user = {
            name: 'Validator User',
            email: 'validator@pulsechat.test',
            password: 'Password123'
        };
        await request(app).post('/api/auth/register').send(user);
        const loginRes = await request(app).post('/api/auth/login').send({
            email: user.email,
            password: user.password
        });
        authToken = loginRes.body.response.data.accessToken;
    });

    // =========================================================================
    // 1. REQUEST BODY VALIDATION (Mode B - Single Schema)
    // =========================================================================
    describe('1. Request Body Validation (req.body)', () => {

        it('should reject registration when required fields are missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('validation failed');
            expect(res.body.errors).toBeDefined();

            const fields = res.body.errors.map(err => err.field);
            expect(fields).toContain('name');
            expect(fields).toContain('email');
            expect(fields).toContain('password');
        });

        it('should reject registration if name is shorter than 3 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Al',
                    email: 'al@pulsechat.test',
                    password: 'Password123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const nameError = res.body.errors.find(err => err.field === 'name');
            expect(nameError).toBeDefined();
            expect(nameError.message).toMatch(/3 characters/i);
        });

        it('should reject registration if name exceeds 20 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'A'.repeat(25),
                    email: 'longname@pulsechat.test',
                    password: 'Password123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const nameError = res.body.errors.find(err => err.field === 'name');
            expect(nameError).toBeDefined();
            expect(nameError.message).toMatch(/20 characters/i);
        });

        it('should reject registration with malformed email addresses', async () => {
            const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com'];

            for (const email of invalidEmails) {
                const res = await request(app)
                    .post('/api/auth/register')
                    .send({
                        name: 'Valid Name',
                        email,
                        password: 'Password123'
                    });

                expect(res.status).toBe(400);
                expect(res.body.success).toBe(false);
                const emailError = res.body.errors.find(err => err.field === 'email');
                expect(emailError).toBeDefined();
            }
        });

        it('should reject registration if password is shorter than 6 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Valid Name',
                    email: 'shortpass@pulsechat.test',
                    password: '123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const passError = res.body.errors.find(err => err.field === 'password');
            expect(passError).toBeDefined();
            expect(passError.message).toMatch(/6 characters/i);
        });

        it('should reject registration if password exceeds 20 characters', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Valid Name',
                    email: 'longpass@pulsechat.test',
                    password: 'P'.repeat(25)
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const passError = res.body.errors.find(err => err.field === 'password');
            expect(passError).toBeDefined();
            expect(passError.message).toMatch(/20 characters/i);
        });

        it('should reject unexpected extra fields when schema is strict', async () => {
            // refreshTokenSchema has .strict() enabled
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({
                    refreshToken: 'dummy.jwt.token',
                    maliciousExtraField: 'exploit_payload'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
            const extraFieldError = res.body.errors.find(err => 
                err.field === 'maliciousExtraField' || err.message.includes('maliciousExtraField')
            );
            expect(extraFieldError).toBeDefined();
        });
    });

    // =========================================================================
    // 2. ROUTE PARAMETER VALIDATION (Mode A - req.params)
    // =========================================================================
    describe('2. Route Parameter Validation (req.params)', () => {

        it('should reject non-hex roomId parameter with 400', async () => {
            const res = await request(app)
                .get('/api/rooms/not-a-valid-hex-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('validation failed');
            const paramError = res.body.errors.find(err => err.field === 'params.roomId');
            expect(paramError).toBeDefined();
            expect(paramError.message).toMatch(/24 hex characters/i);
        });

        it('should reject short ID parameter (< 24 hex chars)', async () => {
            const res = await request(app)
                .get('/api/rooms/12345')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const paramError = res.body.errors.find(err => err.field === 'params.roomId');
            expect(paramError).toBeDefined();
        });

        it('should reject long ID parameter (> 24 hex chars)', async () => {
            const res = await request(app)
                .get(`/api/rooms/${validRoomId}extra123`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const paramError = res.body.errors.find(err => err.field === 'params.roomId');
            expect(paramError).toBeDefined();
        });

        it('should reject invalid messageId parameter on multi-param route', async () => {
            // Route: DELETE /api/rooms/:roomId/messages/:messageId
            const res = await request(app)
                .delete(`/api/rooms/${validRoomId}/messages/invalid-message-id`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const paramError = res.body.errors.find(err => err.field === 'params.messageId');
            expect(paramError).toBeDefined();
            expect(paramError.message).toMatch(/24 hex characters/i);
        });
    });

    // =========================================================================
    // 3. QUERY PARAMETER VALIDATION (Mode A - req.query)
    // =========================================================================
    describe('3. Query Parameter Validation (req.query)', () => {

        it('should reject limit query parameter when less than 1', async () => {
            const res = await request(app)
                .get(`/api/rooms/${validRoomId}/messages?limit=0`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const queryError = res.body.errors.find(err => err.field === 'query.limit');
            expect(queryError).toBeDefined();
        });

        it('should reject limit query parameter when greater than 100', async () => {
            const res = await request(app)
                .get(`/api/rooms/${validRoomId}/messages?limit=150`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const queryError = res.body.errors.find(err => err.field === 'query.limit');
            expect(queryError).toBeDefined();
        });

        it('should reject non-numeric limit query parameter', async () => {
            const res = await request(app)
                .get(`/api/rooms/${validRoomId}/messages?limit=abc`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const queryError = res.body.errors.find(err => err.field === 'query.limit');
            expect(queryError).toBeDefined();
        });

        it('should reject malformed datetime cursor in before query parameter', async () => {
            const res = await request(app)
                .get(`/api/rooms/${validRoomId}/messages?before=yesterday`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            const queryError = res.body.errors.find(err => err.field === 'query.before');
            expect(queryError).toBeDefined();
            expect(queryError.message).toMatch(/datetime/i);
        });
    });

    // =========================================================================
    // 4. NOSQL INJECTION & PAYLOAD SANITIZATION
    // =========================================================================
    describe('4. NoSQL Injection & Sanitization Middleware', () => {

        it('should sanitize and reject NoSQL operator injection in registration body', async () => {
            // Attacker attempts mongo query operator: { "email": { "$gt": "" } }
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Attacker',
                    email: { "$gt": "" },
                    password: 'Password123'
                });

            // Sanitizer strips or alters $gt; Zod string validation rejects non-string email
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should sanitize and reject NoSQL operator injection in login body', async () => {
            // Attacker attempts authentication bypass using $ne operator: { "email": { "$ne": null } }
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: { "$ne": null },
                    password: 'Password123'
                });

            // Must be intercepted by validation / sanitization with 400 Bad Request
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });
    });

});
