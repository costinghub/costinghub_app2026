
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initializing GoogleGenAI directly using process.env.API_KEY as per coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHAT_MODEL = 'gemini-3-flash-preview';
const REASONING_MODEL = 'gemini-3-pro-preview';

/**
 * Sends a message to the AI Chatbot with context about cost engineering.
 */
export const sendChatMessage = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction: `You are an expert Senior Cost Engineer and Manufacturing Consultant for 'CostingHub'. 
        Your goal is to assist users with manufacturing cost estimations, explaining concepts like Zero-Based Costing (ZBC), 
        Machine Hour Rate (MHR) calculations, and material selection. 
        Be concise, professional, and mathematically precise. 
        If asked about platform features, explain that CostingHub handles Machining, Casting, Assembly, and MHR calculations.`,
        temperature: 0.7,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I apologize, but I am currently unable to process your request due to a connection issue.";
  }
};

/**
 * Auto-fills material properties based on a material name.
 */
export const autoFillMaterialData = async (materialName: string) => {
  try {
    const prompt = `Provide technical and cost specifications for the material: "${materialName}". 
    Return a JSON object with density (g/cm3), typical hardness (HB), and an estimated global market raw material rate (USD/kg) as of late 2024.`;

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            density: { type: Type.NUMBER, description: "Density in g/cm3" },
            hardness: { type: Type.STRING, description: "Typical Hardness (e.g., 150 HB)" },
            estimatedRate: { type: Type.NUMBER, description: "Estimated Rate in USD/kg" },
            machinabilityRating: { type: Type.STRING, description: "Machinability rating (e.g., 'Good', 'Poor')" }
          },
          required: ["density", "estimatedRate"]
        }
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Gemini Auto-fill Error:", error);
    return null;
  }
};

/**
 * Suggests manufacturing process steps for a given part description.
 */
export const suggestProcessPlan = async (partDescription: string) => {
  try {
    const prompt = `As a Senior Process Engineer, suggest a sequential manufacturing process plan (operations) for: "${partDescription}".
    Assume a general machining workshop environment.
    Return a JSON array of operations.`;

    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stepNumber: { type: Type.INTEGER },
              operationName: { type: Type.STRING },
              machineType: { type: Type.STRING },
              estimatedCycleTimeMin: { type: Type.NUMBER, description: "Rough estimate in minutes" }
            }
          }
        }
      }
    });

    return response.text ? JSON.parse(response.text) : [];
  } catch (error) {
    console.error("Gemini Process Plan Error:", error);
    return [];
  }
};
