const authRepository = require('../repositories/auth.repository');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } = require('../utils/jwt');

const register = async ({ name, email, password }) => {
    const existingUser = await authRepository.findEmail(email);
    if (existingUser) {
        throw new AppError(
            "Email already registered",
            409,
            "EMAIL_ALREADY_EXISTS"
        );
    }

    const passwordHash = await hashPassword(password);
    const user = await authRepository.createUser({ name, email, passwordHash });
    return user;
};

const login = async ({ email, password }) => {
    const existingUser = await authRepository.findEmail(email);

    if (!existingUser) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const valid = await comparePassword(password, existingUser.passwordHash);

    if (!valid) {
        throw new AppError(
            "Invalid email or password",
            401,
            "INVALID_CREDENTIALS"
        );
    }

    const accessToken = generateAccessToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    const user = existingUser.toObject ? existingUser.toObject() : existingUser;
    delete user.passwordHash;

    return { user, accessToken, refreshToken };
};
const refreshAccessToken = (refreshToken) => {
    try {
        const payload = verifyRefreshToken(refreshToken);

        const accessToken = generateAccessToken({ _id: payload.userId });
        return { accessToken };
    }

    catch (error) {
        throw new AppError(
            "Invalid refresh token",
            401,
            "INVALID_REFRESH_TOKEN"
        );
    }
}

module.exports = { register, login, refreshAccessToken };