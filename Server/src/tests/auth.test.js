const request = require('supertest');
const app = require('../app');

describe('Authentication API Endpoints', () => {

    const testUser = {
        name: 'Test Engineer',
        email: 'engineer@pulsechat.test',
        password: 'Password123'
    };

    // 1. REGISTRATION TESTS
    describe('POST /api/auth/register', () => {
        it('should successfully register a new user with valid data', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(201);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data).toHaveProperty('_id');
            expect(res.body.response.data.email).toBe(testUser.email.toLowerCase());
            expect(res.body.response.data).not.toHaveProperty('passwordHash');
        });

        it('should reject registration if email already exists', async () => {
            // First registration
            await request(app).post('/api/auth/register').send(testUser);

            // Duplicate registration attempt
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.status).toBe(409);
            expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
        });

        it('should reject registration with invalid email or short password', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Te', // too short
                    email: 'not-an-email',
                    password: '123' // too short
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors).toBeDefined();
        });
    });

    // 2. LOGIN TESTS
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(testUser);
        });

        it('should successfully log in and return access and refresh tokens', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data).toHaveProperty('accessToken');
            expect(res.body.response.data).toHaveProperty('refreshToken');
            expect(res.body.response.data.user.email).toBe(testUser.email.toLowerCase());
        });

        it('should reject login with incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword999'
                });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
        });

        it('should reject login with non-existent email', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'ghost@pulsechat.test',
                    password: 'Password123'
                });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
        });
    });

    // 3. TOKEN AUTHENTICATION & VERIFICATION
    describe('JWT Verification on Protected Routes', () => {
        let accessToken;

        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(testUser);
            const loginRes = await request(app).post('/api/auth/login').send({
                email: testUser.email,
                password: testUser.password
            });
            accessToken = loginRes.body.response.data.accessToken;
        });

        it('should allow access to protected route with valid Bearer token', async () => {
            const res = await request(app)
                .get('/api/rooms')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
        });

        it('should reject access with 401 UNAUTHORIZED if token is missing', async () => {
            const res = await request(app).get('/api/rooms');

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('UNAUTHORIZED');
        });

        it('should reject access with 401 INVALID_TOKEN if token is malformed', async () => {
            const res = await request(app)
                .get('/api/rooms')
                .set('Authorization', 'Bearer fake.invalid.jwt');

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('INVALID_TOKEN');
        });
    });

    // 4. TOKEN REFRESH FLOW
    describe('POST /api/auth/refresh', () => {
        let refreshToken;

        beforeEach(async () => {
            await request(app).post('/api/auth/register').send(testUser);
            const loginRes = await request(app).post('/api/auth/login').send({
                email: testUser.email,
                password: testUser.password
            });
            refreshToken = loginRes.body.response.data.refreshToken;
        });

        it('should generate a new access token when provided a valid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.response.success).toBe(true);
            expect(res.body.response.data).toHaveProperty('accessToken');
        });

        it('should reject refresh request if refresh token is invalid', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({ refreshToken: 'invalid.refresh.token' });

            expect(res.status).toBe(401);
            expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
        });
    });

});
