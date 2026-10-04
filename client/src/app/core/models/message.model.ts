export interface MessageSender {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface SendMessageRequest {
  content: string;
  messageType?: string;
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: MessageSender;
  content: string;
  messageType: string;
  createdAt: string;
  updatedAt: string;
}