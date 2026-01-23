
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
  timestamp: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  category?: string;
  isPremium?: boolean;
}

export interface UserContext {
  quarterlyGoal: string;
  weeklySentiment: string;
}

export interface SendMessagePayload {
  userId: string;
  recipeId: string;
  messageText: string;
  messageHistory: { role: Role; content: string }[];
}
