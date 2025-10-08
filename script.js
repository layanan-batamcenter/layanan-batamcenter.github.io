const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");

// === Konfigurasi
// API request to Gemini (or AI API)
const apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=';  // Ganti dengan endpoint API yang sesuai
const apiKey = 'AIzaSyCXKZ5eibGqPOWaxDsuExbb0uLnT62Hpdw';  // Ganti dengan API Key yang benar

const API_URL = apiEndpoint + apiKey;
const SYSTEM_PROMPT = "Jawab pertanyaan user berdasarkan data yang diberikan.";
const USER_INFO = {
  date: "2025-10-08",
  location: "Batam Center"
};

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = "message " + (sender === "user" ? "user-message" : "bot-message");
  msg.innerHTML = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const question = userInput.value.trim();
  if (!question) return;
  addMessage(question, "user");
  userInput.value = "";

  // === Tahap 1: Intent detection
  const promptIntent = `
User bertanya: "${question}"
Tentukan nama dataset yang paling relevan untuk menjawab pertanyaan ini dari daftar berikut: [databerita, datalayanan, datapenduduk]
Jawaban hanya berisi nama dataset.
  `;

  const datasetName = await callGemini(promptIntent);
  const cleanedDataset = datasetName.trim().toLowerCase();

  try {
    const dataset = await fetch(`${cleanedDataset}.json`).then(res => res.json());

    // === Tahap 2: Jawaban final
    const finalPrompt = `
Jawablah pertanyaan berikut:

"${question}"

Berdasarkan data berikut (format JSON):
${JSON.stringify(dataset, null, 2)}

User information:
- Date: ${USER_INFO.date}
- Location: ${USER_INFO.location}

Jawaban kamu harus ringkas dan relevan dengan pertanyaan user.
    `;

    const finalAnswer = await callGemini(finalPrompt);
    addMessage(finalAnswer, "bot");

  } catch (e) {
    console.error(e);
    addMessage("Gagal membaca data atau menjawab pertanyaan.", "bot");
  }
}

async function callGemini(prompt) {
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    safetySettings: [],
    generationConfig: { temperature: 0.2 }
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada jawaban.";
}
