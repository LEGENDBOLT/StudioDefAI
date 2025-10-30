

import { GoogleGenAI, Type } from "@google/genai";
import type { Session, Analysis } from '../types';
import { loadApiKey } from './storageService';

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    concentration: {
      type: Type.INTEGER,
      description: "A rating of the user's concentration on a scale of 1 to 100, based on their notes.",
    },
    studyCapacity: {
      type: Type.INTEGER,
      description: "A rating of the user's study capacity or productivity on a scale of 1 to 100.",
    },
    stress: {
      type: Type.INTEGER,
      description: "An inferred rating of the user's stress level on a scale of 1 to 100 (where 1 is low stress and 100 is high stress).",
    },
    happiness: {
      type: Type.INTEGER,
      description: "An inferred rating of the user's happiness or mood on a scale of 1 to 100.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief, encouraging summary of the study period, highlighting trends or key points.",
    },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of 2-3 actionable and personalized suggestions for the user to improve their next study sessions.",
    },
  },
  required: ["concentration", "studyCapacity", "stress", "happiness", "summary", "suggestions"],
};


export const analyzeStudySessions = async (sessions: Session[]): Promise<Omit<Analysis, 'date'>> => {
  const apiKey = loadApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY_NOT_FOUND");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-pro';

  const prompt = `
    Analyze the following study session notes from a user. The user is tracking their productivity and well-being.
    Based on their notes, provide a detailed analysis.

    Session Data:
    ${JSON.stringify(sessions.map(s => ({ duration: s.duration, notes: s.notes })), null, 2)}

    Your task is to infer their state of mind and productivity during these sessions.
    Return a JSON object with ratings for concentration, study capacity, stress, and happiness (all from 1-100).
    Also provide a brief summary and some actionable suggestions for them to improve.
    Be encouraging and supportive in your tone.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      console.error("API response did not contain text.", response);
      throw new Error("La risposta dell'AI era vuota o non valida.");
    }
    
    const parsedJson = JSON.parse(jsonText.trim());

    // Basic validation
    if (
      typeof parsedJson.concentration !== 'number' ||
      typeof parsedJson.summary !== 'string' ||
      !Array.isArray(parsedJson.suggestions)
    ) {
      throw new Error("Invalid JSON structure received from API");
    }

    return parsedJson as Omit<Analysis, 'date'>;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Impossibile ottenere l'analisi dall'AI. Controlla la tua chiave o riprova.");
  }
};