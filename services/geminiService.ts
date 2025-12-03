import { GoogleGenAI, Content } from "@google/genai";
import { Message, NPC, Role } from '../types';

export const generateReply = async (
  npc: NPC,
  history: Message[],
  userMessage: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "Error: API Key is missing in environment variables.";
  }

  const ai = new GoogleGenAI({ apiKey });

  // Convert internal message history to Gemini Content format
  const formattedHistory: Content[] = history.map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `Character: ${npc.name}. Context: ${npc.roleDescription}. 
        Constraint: Speak English only. Keep responses concise (under 50 words) suitable for a game dialog.`,
      },
      history: formattedHistory,
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I got a bit lost in thought. Could you say that again?";
  }
};