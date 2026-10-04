export interface RoomMember {
    _id: string;
    roomId: string;
    role: 'owner' | 'admin' | 'member';
    userId?: {
        _id: string;
        name: string;
        email: string;
    };
}