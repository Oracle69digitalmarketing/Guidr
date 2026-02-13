
import { Recipe } from './types';

export const RECIPES: Recipe[] = [
  {
    id: "weekly_review_v1",
    name: "The Weekly Review System",
    description: "A structured 5-step chat to reflect on your week and plan the next with clarity.",
    icon: "📋",
    category: "Productivity",
    isPremium: false
  },
  {
    id: "decision_matrix_v1",
    name: "The Decision Matrix",
    description: "Make tough choices using a weighted criteria system and your core values.",
    icon: "⚖️",
    category: "Decisions",
    isPremium: true
  },
  {
    id: "energy_audit_v1",
    name: "The Energy Audit",
    description: "Audit your activities to boost your daily energy and reduce mental drain.",
    icon: "⚡",
    category: "Mindset",
    isPremium: true
  }
];

export const COACH_GREETINGS: Record<string, string> = {
  weekly_review_v1: "Ready to look back at your week? Let's start with a win. What's one thing from your past week, big or small, that you feel good about?",
  decision_matrix_v1: "Facing a tough choice? Tell me what options you're deciding between, and we'll break them down.",
  energy_audit_v1: "Let's check your battery. List 5-7 main activities you did last week, and we'll see which ones gave you energy."
};


