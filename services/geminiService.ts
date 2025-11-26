import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceData, LineItem, Product } from "../types";

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
          description: { type: Type.STRING, description: "Description or matching product name" },
          flavor: { type: Type.STRING, description: "Flavor of the cake" },
          weight: { type: Type.STRING, description: "Weight of the cake (e.g. 1kg, 2lbs)" },
          quantity: { type: Type.NUMBER, description: "Quantity of items" },
          price: { type: Type.NUMBER, description: "Price of the item. Use menu price if matched, otherwise estimate." },
        },
        required: ["description", "quantity", "price"],
      },
    },
  },
  required: ["items"],
};

export const parseOrderWithGemini = async (orderText: string, menuItems: Product[] = []): Promise<Partial<InvoiceData>> => {
  try {
    // Construct a menu string context
    const menuContext = menuItems.length > 0 
      ? `Here is the bakery's menu with prices. Try to match items from the text to these exact names and prices where possible: \n${menuItems.map(p => `- ${p.name}: $${p.price} (${p.flavor || 'Standard'}, ${p.weight || 'Standard'})`).join('\n')}`
      : "No specific menu provided, estimate reasonable bakery prices.";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract cake order details from this text: "${orderText}". 
      ${menuContext}
      If prices are not mentioned and no menu match found, estimate reasonable prices.
      Format the date as YYYY-MM-DD.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: orderSchema,
        systemInstruction: "You are an assistant for a bakery called 'Cake Dudes'. You help parse unstructured order messages into structured invoice data. Always prefer menu items if they loosely match.",
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