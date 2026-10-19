// Set test environment variables before anything else loads
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.JWT_ACCESS_SECRET = 'test_super_secret_access_key_12345';
process.env.JWT_REFRESH_SECRET = 'test_super_secret_refresh_key_12345';
process.env.CLIENT_URL = 'http://localhost:4200';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// 1. Start in-memory MongoDB before any tests run
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}, 90000);

// 2. Clear all collections between individual tests
afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
});

// 3. Stop in-memory MongoDB and disconnect after all tests complete
afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
