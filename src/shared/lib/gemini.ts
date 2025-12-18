import type { Question } from "../../features/exam/store";

export class GeminiService {
    private apiKey: string;
    private baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 1000): Promise<Response> {
        try {
            const response = await fetch(url, options);

            if (response.status === 429) {
                if (retries <= 0) throw new Error("API Quota Exceeded. Please try again later.");
                console.warn(`Rate limited. Retrying in ${backoff}ms...`);
                await new Promise(resolve => setTimeout(resolve, backoff));
                return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
            }

            return response;
        } catch (error) {
            if (retries <= 0) throw error;
            console.warn(`Fetch error. Retrying... ${error}`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
    }

    async verifyKey(): Promise<{ valid: boolean; error?: string }> {
        try {
            const cleanKey = this.apiKey.trim();
            if (!cleanKey) return { valid: false, error: "Key is empty" };

            const response = await this.fetchWithRetry(`${this.baseUrl}?key=${cleanKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Test connection. Reply with 'OK'." }] }]
                })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorBody);
                    if (errorJson.error && errorJson.error.message) {
                        errorMessage = errorJson.error.message;
                    }
                } catch { /* Ignore */ }
                console.error("Gemini Verification Failed:", errorMessage);
                return { valid: false, error: errorMessage };
            }

            const data = await response.json();
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                return { valid: true };
            }

            return { valid: false, error: "Unexpected response format from AI" };
        } catch (error) {
            console.error("Gemini Key Verification Network Failed:", error);
            return { valid: false, error: error instanceof Error ? error.message : "Network Error" };
        }
    }

    async analyzeTopics(questions: Question[]): Promise<Record<number, string>> {
        const simplifiedQuestions = questions.map(q => ({
            id: q.id,
            text: q.question.substring(0, 200)
        }));

        const prompt = `
        You are an expert exam classifier. 
        Analyze the following questions and assign a SINGLE, broad academic topic to each (e.g., 'History', 'Physics', 'Geography', 'Mathematics', 'Biology', 'Computer Science', 'English', 'General Knowledge').
        Keep topics CONSISTENT. Return a JSON object where keys are question IDs (as strings) and values are the Topic strings.
        Example: { "1": "History", "2": "Physics" }
        Questions:
        ${JSON.stringify(simplifiedQuestions)}
        `;

        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const responseText = data.candidates[0].content.parts[0].text;
            console.log("Raw Gemini Response:", responseText);

            const parsed = JSON.parse(responseText);
            const rigidParsed: Record<number, string> = {};
            for (const key in parsed) {
                rigidParsed[Number(key)] = parsed[key];
            }
            return rigidParsed;
        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            throw new Error("Failed to analyze topics via AI.");
        }
    }

    async generateQuestions(subject: string, topic: string, count: number, difficulty: string, format: string): Promise<Question[]> {
        const prompt = `
        ### **ROLE & OBJECTIVE**
        You are the **Chief Examiner** for high-stakes competitive exams (SSC CGL Tier-2, CAT, UPSC). Your job is to create a **"Rank-Decider" Question Bank** that filters out average students and tests only the top 1% of aspirants.
        
        ### **TASK SPECIFICATIONS**
        **1. Target Subject:** ${subject}
        **2. Specific Topic:** ${topic}
        **3. Total Questions:** ${count}
        **4. Difficulty Level:** ${difficulty} (Focus on exceptions, rare rules, and "trap" questions).
        **5. Question Format:** ${format}
        
        ### **STRICT OUTPUT GUIDELINES (DO NOT IGNORE)**
        * OUTPUT MUST BE A JSON ARRAY OF OBJECTS ONLY. NO MARKDOWN.
        
        JSON Structure per question:
        {
          "question": "The question text itself...",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0, // Index of correct option (0-3)
          "explanation": "Markdown formatted explanation...",
          "topic": "${topic}"
        }
        `;

        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            console.log("Gemini Generated Response:", text);

            try {
                const parsed = JSON.parse(text);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return parsed.map((q: any, i: number) => ({
                    id: i + 1,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    topic: q.topic
                }));
            } catch {
                console.error("Failed to parse AI response. Raw text:", text);
                return [];
            }

        } catch (error) {
            console.error("Gemini Generation Failed:", error);
            throw error;
        }
    }
}
