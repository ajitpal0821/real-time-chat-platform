export interface Room {
    _id: string;
    name: string;
    roomId: string;
    ownerId: string;
    isPrivate?: boolean;
    createdAt?: string;
    updatedAt?: string;
}