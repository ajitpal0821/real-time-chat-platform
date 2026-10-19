require("dotenv").config();

const { z } = require("zod");


const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGO_URI: z.string().min(1, { message: "MONGO_URI is required" }),
    JWT_ACCESS_SECRET: z.string().min(10, { message: "JWT_ACCESS_SECRET must be at least 10 characters" }),
    JWT_REFRESH_SECRET: z.string().min(10, { message: "JWT_REFRESH_SECRET must be at least 10 characters" }),
    CLIENT_URL: z.string().default("http://localhost:4200"),
    REDIS_URL: z.string().optional()
});

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("❌ CRITICAL: Invalid or missing Environment Variables:");
        result.error.issues.forEach((issue) => {
            console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
        });
        process.exit(1); // Stop server immediately
    }
    return result.data;
};
const env = parseEnv();
module.exports = env;