const roomRepository = require('../repositories/room.repository');
const roomMemberRepository = require('../repositories/roomMember.repository');
const { setCache, getCache, DeleteCache } = require('../utils/cache.js');


const AppError = require('../utils/AppError');;

const createRoom = async (userId, data) => {


    const room = await roomRepository.create({
        ...data, ownerId: userId
    });

    await roomMemberRepository.create({
        roomId: room._id,
        userId,
        role: "owner"
    })
    return room;
}

const getRoom = async (roomId, userId) => {

    const member = await roomMemberRepository.findMember(roomId, userId);

    const cacheKey = `room:${roomId}`;
    const cachedRoom = await getCache(cacheKey);
    if (cachedRoom) {
        return cachedRoom;
    }
    if (!member) {
        throw new AppError(
            "You are not a member of this room",
            403,
            "ROOM_ACCESS_DENIED"
        );
    }


    const room = await roomRepository.findById(roomId);
    await setCache(cacheKey, room, 60 * 5); // Cache for 5 minutes
    if (!room) {
        throw new AppError(
            "Room not found",
            404,
            "ROOM_NOT_FOUND"
        );
    }
    await setCache(cacheKey, room, 60 * 5); // Cache for 5 minutes

    return room;
}

const getMyRooms = async (userId) => {
    const memberShips = await roomMemberRepository.findByUser(userId);

    return memberShips.map(memberShip => memberShip.roomId);
}

const joinRoom = async (roomId, userId) => {
    const room = await roomRepository.findById(roomId);

    if (!room) {
        if (!room) {
            throw new AppError(
                "Room not found",
                404,
                "ROOM_NOT_FOUND"
            );
        }
    }

    if (room.isPrivate) {
        throw new AppError(
            "Private room requires an invitation",
            403,
            "PRIVATE_ROOM"
        );
    }

    const existing = await roomMemberRepository.findMember(roomId, userId);
    if (existing) {
        throw new AppError(
            "Already a member",
            409,
            "ALREADY_MEMBER"
        );
    }

    return roomMemberRepository.create({
        roomId, userId, role: "member"
    });

}

const leaveRoom = async (roomId, userId) => {
    const room = await roomRepository.findById(roomId);

    if (!room) {
        throw new AppError(
            "Room not found",
            404,
            "ROOM_NOT_FOUND"
        );
    }

    const existing = await roomMemberRepository.findMember(roomId, userId);
    if (!existing) {
        throw new AppError(
            "You are not a member of this room",
            404,
            "ROOM_MEMBERSHIP_NOT_FOUND"
        );
    }

    if (existing.role === "owner") {
        throw new AppError(
            "Owner cannot leave the room",
            400,
            "OWNER_CANNOT_LEAVE"
        );
    }

    return roomMemberRepository.remove(roomId, userId);
}

const getMembers = async (roomId, userId) => {
    const room = await roomRepository.findById(roomId);
    if (!room) {
        throw new AppError(
            "Room not found",
            404,
            "ROOM_NOT_FOUND"
        );
    }

    const requester = await roomMemberRepository.findMember(roomId, userId);
    if (!requester) {
        throw new AppError(
            "You do not have access to this room",
            403,
            "ROOM_ACCESS_DENIED"
        );
    }

    return roomMemberRepository.findByRoom(roomId);

}

module.exports = { createRoom, getRoom, getMyRooms, joinRoom, leaveRoom, getMembers }