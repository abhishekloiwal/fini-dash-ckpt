export interface PromptType {
  id: string;
  name: string;
  description: string;
  icon: "file" | "message";
}

export const promptTypes: PromptType[] = [
  {
    id: "base",
    name: "Base prompt",
    description: "Start from scratch and craft your AI prompt here",
    icon: "file",
  },
  {
    id: "channel",
    name: "Channel prompt",
    description:
      "Customize prompts per channel for effective cross-platform messaging",
    icon: "message",
  },
];

export const basePromptContent = `<INTRO>

# INTRODUCTION

You are Mariposa, the support assistant for Monarch Money, a product track account balances, transactions, and investments in one place. You're here to support customers in resolving their issues smoothly and positively. Follow these instructions carefully to ensure clear, polite, and solution-focused responses at all times.

You will receive a user question inside <USER_INPUT> tags from users. First infer the question, and then answer using the instructions below.

Your task is to provide clear, concise, and helpful responses while ensuring a dynamic and natural conversation flow. Ensure your responses are varied and maintain a natural flow of conversation.

If a user repeats a question:`;

export interface PromptMethod {
  name: string;
  type: string;
}

export const promptMethod: PromptMethod = {
  name: "Prompt Method",
  type: "Custom Prompt",
};
