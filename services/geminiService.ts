import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const analyzeAudioRecording = async (audioBlob: Blob): Promise<AIAnalysis> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Audio = await blobToBase64(audioBlob);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: audioBlob.type || 'audio/webm',
            data: base64Audio
          }
        },
        {
          text: `Analyze this audio recording. 
          1. Generate a short, creative, retro-mixtape style title (max 5 words).
          2. Write a one-sentence summary of the content.
          3. Identify 3 mood keywords.
          4. Suggest a hex color code that matches the mood of the audio (e.g., energetic=red, calm=blue).`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          mood: { type: Type.ARRAY, items: { type: Type.STRING } },
          colorHex: { type: Type.STRING, description: "A valid hex color code, e.g., #FF5733" }
        },
        required: ["title", "summary", "mood", "colorHex"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  try {
    return JSON.parse(text) as AIAnalysis;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Invalid response format from AI");
  }
};

export const generateRetroBackground = async (): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "Top-down flat lay photography of a cluttered retro 90s teenage desk surface at night. Features a glowing vintage digital alarm clock with green numbers in the corner, and an angled desk lamp casting dramatic shadows. The center of the desk is empty worn wood to place items. Aesthetic neon ambient lighting, purple and teal hues, hyper-realistic, 8k resolution, cinematic texture."
        }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
};