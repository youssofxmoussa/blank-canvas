const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function extractTextFromImage(
  base64Image: string,
  mimeType: string,
  prompt = "Extract all text from this image. Return only the extracted text, preserving the original formatting as much as possible."
): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No text extracted.";
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
