import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { InvoiceData, LineItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We define a partial schema to extract order details
const orderSchema = {
  type: Type.OBJECT,
  properties: {
    customerName: { type: Type.STRING, description: "Customer's full name if mentioned" },
    customerPhone: { type: Type.STRING, description: "Customer's phone number if mentioned" },
    customerAddress: { type: Type.STRING, description: "Delivery address if mentioned" },
    date: { type: Type.STRING, description: "Order date in YYYY-MM-DD format" },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Short description of the cake or item" },
          flavor: { type: Type.STRING, description: "Flavor of the cake" },
          weight: { type: Type.STRING, description: "Weight of the cake (e.g. 1kg, 2lbs)" },
          quantity: { type: Type.NUMBER, description: "Quantity of items" },
          price: { type: Type.NUMBER, description: "Estimated price per unit based on standard cake pricing logic (assume $20/kg base if unknown)" },
        },
        required: ["description", "quantity", "price"],
      },
    },
  },
  required: ["items"],
};

export const parseOrderWithGemini = async (orderText: string): Promise<Partial<InvoiceData>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract cake order details from this text: "${orderText}". 
      If prices are not mentioned, estimate reasonable prices for a bakery.
      Format the date as YYYY-MM-DD.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: orderSchema,
        systemInstruction: "You are an assistant for a bakery called 'Cake Dudes'. You help parse unstructured order messages into structured invoice data.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const parsedData = JSON.parse(text);

    // Transform API response to fit our strict LineItem structure with IDs
    const items: LineItem[] = (parsedData.items || []).map((item: any) => ({
      id: crypto.randomUUID(),
      description: item.description || "Custom Cake",
      quantity: item.quantity || 1,
      price: item.price || 0,
      flavor: item.flavor || "",
      weight: item.weight || "",
    }));

    return {
      customerName: parsedData.customerName || "",
      customerPhone: parsedData.customerPhone || "",
      customerAddress: parsedData.customerAddress || "",
      date: parsedData.date || new Date().toISOString().split('T')[0],
      items: items.length > 0 ? items : undefined,
    };

  } catch (error) {
    console.error("Error parsing order with Gemini:", error);
    throw error;
  }
};