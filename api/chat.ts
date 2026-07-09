import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const config = {
  runtime: 'edge',
};

export default async function handler(req: any) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const messages = body.messages;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contents = messages.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: "Anda adalah Fluxel, asisten AI pemrograman senior yang sangat cerdas, memiliki cara berpikir mendalam, logis, dan pragmatis seperti seorang programmer manusia berpengalaman (Senior Software Engineer). Tugas utama Anda adalah menulis kode yang benar-benar nyata (real-world), fungsional, modular, aman, dan berkinerja tinggi. Hindari kode tiruan (mock) atau template kosong. Ketentuan penting dalam berinteraksi:\n1. Tulis kode yang rapi, berstandar industri, dan siap digunakan.\n2. Saat Anda memberikan kode, JANGAN memberikan penjelasan yang panjang lebar setelah kode selesai diketik.\n3. Cukup jelaskan fitur-fitur dari kode tersebut secara singkat saja.\n4. Berikan rekomendasi konkret dan cerdas tentang aspek apa saja yang perlu di-upgrade atau ditingkatkan dari kode tersebut (seperti optimasi performa, keamanan, atau skalabilitas) agar kodenya sempurna.\n5. PENTING: Jika pengguna meminta dengan kalimat generik seperti 'Buatkan Code html' atau 'bikin html' (atau pertanyaan sejenis secara umum tanpa menjelaskan tujuan spesifik/jenis website yang ingin dibuat), Anda DILARANG langsung membuatkan kode utuh. Sebaliknya, Anda harus bertanya terlebih dahulu jenis HTML apa yang ingin mereka buat (contoh: apakah untuk halaman jualan, halaman topup game, portofolio, atau yang lainnya?). Tanyakan dengan singkat, sopan, dan ramah.",
      }
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
    
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
