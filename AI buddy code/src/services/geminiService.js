const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to extract JSON from markdown or raw text
function extractJson(text) {
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (inner) {
        // failed parse
      }
    }
    throw new Error('Failed to parse JSON from AI response');
  }
}

// Academic Fallback Generators when API key is missing or quota is exceeded
function generateFallbackSummary(content, title) {
  const sentences = content.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 10);
  const mainPoints = sentences.slice(0, Math.min(5, sentences.length));
  const summaryText = (mainPoints.length > 0 ? mainPoints.join(' ') : content).slice(0, 500);

  const important = [
    sentences[0] || 'Core principles and fundamental definitions of the topic',
    sentences[1] || 'System mechanics, workflows, and functional relationships',
    sentences[2] || 'Practical applications and exam-relevant problem solving',
  ];

  const words = content.split(/\s+/).filter(w => w.length > 6);
  const term1 = words[0] || 'Concept';
  const term2 = words[1] || 'Mechanism';

  return {
    shortSummary: summaryText.slice(0, 200) + '...',
    summary: `### Academic Summary: ${title || 'Study Material'}\n\n${summaryText}\n\n**Key Takeaways:**\n- Core concepts covered in this topic provide fundamental grounding.\n- Understanding the definitions and architectural layers is essential for exam preparation.\n- Systematic review and testing with flashcards will solidify retention.`,
    importantPoints: important,
    keyTerms: [
      { term: term1, definition: `Primary foundational terminology referenced in ${title || 'the study text'}.` },
      { term: term2, definition: `Key operational component governing execution and workflow.` }
    ],
    mainConcepts: [
      `Architectural foundations of ${title || 'this topic'}`,
      'Inter-process communication and state management',
      'Performance optimization and fault tolerance'
    ],
    keyPoints: important,
  };
}

function generateFallbackFlashcards(content, count = 5) {
  const sentences = content.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 15);
  const cards = [];
  const targetCount = Math.min(Math.max(count, 3), 10);

  for (let i = 0; i < targetCount; i++) {
    const sentence = sentences[i % sentences.length] || `Core concept in this subject #${i + 1}`;
    cards.push({
      question: `Explain the significance of: "${sentence.slice(0, 60)}..."`,
      answer: sentence.length > 40 ? sentence : `Key definition: ${sentence}. It represents an essential mechanism described in the curriculum.`
    });
  }
  return cards;
}

function generateFallbackQuiz(content, subject, count = 5) {
  const targetCount = Math.min(Math.max(count, 3), 10);
  const questions = [];
  const words = content.split(/\s+/).filter(w => w.length > 5);

  for (let i = 1; i <= targetCount; i++) {
    const focusWord = words[i % words.length] || 'concept';
    questions.push({
      question: `In the context of ${subject || 'this study material'}, which statement regarding ${focusWord} is most accurate?`,
      options: [
        `It serves as an essential primary component and ensures standard operation`,
        `It is completely deprecated and no longer utilized in modern architecture`,
        `It only operates in isolated offline environments without networking`,
        `It requires direct manual memory allocation at runtime`
      ],
      answer: `It serves as an essential primary component and ensures standard operation`
    });
  }
  return questions;
}

function generateFallbackStudyPlan(subject, materials, dailyHours, examDate) {
  const exam = examDate ? new Date(examDate).toLocaleDateString() : 'Upcoming Exam';
  const hours = dailyHours || '2 hours/day';

  return {
    title: `Comprehensive Study Roadmap for ${subject}`,
    overview: `Targeting exam readiness by ${exam} allocating ${hours}.`,
    schedule: [
      {
        day: 'Day 1',
        title: 'Foundations & Terminology',
        duration: hours,
        topics: ['Core definitions', 'Fundamental principles', 'Review introductory study materials'],
        recommendedActions: 'Read uploaded notes and generate summary'
      },
      {
        day: 'Day 2',
        title: 'Deep Dive & Mechanisms',
        duration: hours,
        topics: ['Process flows', 'System components and interactions', 'Key algorithms or patterns'],
        recommendedActions: 'Review flashcards and test recall'
      },
      {
        day: 'Day 3',
        title: 'Practical Application & Analysis',
        duration: hours,
        topics: ['Comparative case studies', 'Common edge cases and error scenarios'],
        recommendedActions: 'Take self-assessment AI quizzes'
      },
      {
        day: 'Day 4',
        title: 'Consolidation & Mock Exam',
        duration: hours,
        topics: ['Comprehensive review of all weak topics', 'Speed and accuracy practice'],
        recommendedActions: 'Final review and mock exam rehearsal'
      }
    ]
  };
}

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.client = null;
    this.initClient();
  }

  initClient() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey && this.apiKey.trim().length > 10) {
      try {
        this.client = new GoogleGenerativeAI(this.apiKey.trim());
      } catch (err) {
        console.error('[Gemini Service] Error initializing GoogleGenerativeAI:', err.message);
        this.client = null;
      }
    }
  }

  getModel(modelName = 'gemini-1.5-flash') {
    if (!this.client) {
      this.initClient();
    }
    if (!this.client) return null;
    return this.client.getGenerativeModel({ model: modelName });
  }

  async generateSummary(content, title = 'Study Material') {
    const model = this.getModel();
    if (model) {
      try {
        const prompt = `You are an expert academic tutor. Summarize the following study material titled "${title}".
Provide a structured academic analysis with:
1. shortSummary: A 2-3 sentence high-level overview.
2. summary: A comprehensive academic explanation (2-3 paragraphs with Markdown).
3. importantPoints: Array of 3-5 crucial takeaways.
4. keyTerms: Array of objects [{ "term": "...", "definition": "..." }] for 2-4 critical technical terms.
5. mainConcepts: Array of 2-4 core principles covered.

Format:
{
  "shortSummary": "...",
  "summary": "...",
  "importantPoints": ["...", "..."],
  "keyTerms": [
    { "term": "...", "definition": "..." }
  ],
  "mainConcepts": ["...", "..."],
  "keyPoints": ["...", "..."]
}
Only output valid JSON matching this schema.

Study Material:
${content}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = extractJson(text);
        if (parsed) {
          if (!parsed.keyPoints && parsed.importantPoints) {
            parsed.keyPoints = parsed.importantPoints;
          }
          return parsed;
        }
      } catch (err) {
        console.warn('[Gemini Service] Fallback for summary generation:', err.message);
      }
    }
    return generateFallbackSummary(content, title);
  }

  async generateFlashcards(content, count = 5) {
    const model = this.getModel();
    if (model) {
      try {
        const prompt = `You are an academic flashcard creator. Analyze the study content below and generate ${count} high-quality flashcards for student revision.
Each flashcard must test a core concept, definition, mechanism, or relationship.
Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "question": "Clear, concise question?",
    "answer": "Accurate, clear academic answer."
  }
]

Content:
${content}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = extractJson(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('[Gemini Service] Fallback for flashcard generation:', err.message);
      }
    }
    return generateFallbackFlashcards(content, count);
  }

  async generateQuiz(content, subject = 'General', count = 5) {
    const model = this.getModel();
    if (model) {
      try {
        const prompt = `You are an expert exam designer. Create a multiple choice quiz with exactly ${count} questions based on the following material for subject "${subject}".
Each question must have:
- "question": string
- "options": array of 4 distinct choices [string, string, string, string]
- "answer": string that EXACTLY matches one of the 4 options

Return ONLY a valid JSON array of question objects:
[
  {
    "question": "Question text?",
    "options": ["Choice A", "Choice B", "Choice C", "Choice D"],
    "answer": "Choice A"
  }
]

Content:
${content}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = extractJson(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn('[Gemini Service] Fallback for quiz generation:', err.message);
      }
    }
    return generateFallbackQuiz(content, subject, count);
  }

  async generateStudyPlan(subject, materialsText, dailyHours = '2 hours/day', examDate = null) {
    const model = this.getModel();
    if (model) {
      try {
        const prompt = `You are an academic study planner. Design a structured daily study plan for the subject "${subject}".
Available daily study time: ${dailyHours}.
Target exam date: ${examDate || 'Soon'}.
Study material context: ${materialsText || 'Curriculum fundamentals'}.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Study Plan Title",
  "overview": "Brief strategic overview for the student",
  "schedule": [
    {
      "day": "Day 1",
      "title": "Topic or Focus Area",
      "duration": "${dailyHours}",
      "topics": ["Topic A", "Topic B"],
      "recommendedActions": "Study actions (e.g. read notes, flashcards, quiz)"
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = extractJson(text);
        if (parsed && parsed.schedule) {
          return parsed;
        }
      } catch (err) {
        console.warn('[Gemini Service] Fallback for study plan generation:', err.message);
      }
    }
    return generateFallbackStudyPlan(subject, materialsText, dailyHours, examDate);
  }

  async chatWithAI(messages, context = '') {
    const model = this.getModel();
    if (model) {
      try {
        // Build conversational history
        const systemInstruction = `You are "AI Study Buddy", a friendly, motivating, and academically rigorous study tutor.
Explain complex concepts simply, use bullet points, clear examples, and analogies when appropriate.
Help students prepare for exams and understand concepts thoroughly.`;

        let prompt = `${systemInstruction}\n`;
        if (context) {
          prompt += `Student's Context / Study Material:\n${context}\n\n`;
        }
        prompt += `Conversation History:\n`;

        if (Array.isArray(messages)) {
          messages.forEach(m => {
            prompt += `${m.role === 'user' ? 'Student' : 'AI Study Buddy'}: ${m.content}\n`;
          });
        } else if (typeof messages === 'string') {
          prompt += `Student: ${messages}\n`;
        }
        prompt += `AI Study Buddy:`;

        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        console.warn('[Gemini Service] Fallback for chat:', err.message);
      }
    }

    const lastMsg = Array.isArray(messages) ? messages[messages.length - 1]?.content : messages;
    return `Hello! I am your **AI Study Buddy**. 
Regarding your question about **${lastMsg ? lastMsg.slice(0, 40) : 'your studies'}**:

1. **Fundamental Concept:** In academic learning, breaking complex topics into core principles, practical examples, and review flashcards leads to the highest retention.
2. **Key Recommendation:** Always test yourself with active recall (quizzes) rather than passive reading.
3. **Next Steps:** You can upload study materials in the "Study Materials" section, generate flashcards, and test your knowledge!

*(Tip: To enable live Google Gemini responses, add your \`GEMINI_API_KEY\` in the \`.env\` file).*`;
  }

  async explainTopic(topic, level = 'undergraduate') {
    const model = this.getModel();
    if (model) {
      try {
        const prompt = `You are an academic educator. Explain the following topic for a ${level} student:
Topic: "${topic}"

Provide:
1. High-level definition & intuition
2. Core mechanism / how it works
3. Real-world example
4. Common pitfalls or exam questions`;

        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        console.warn('[Gemini Service] Fallback for explanation:', err.message);
      }
    }

    return `### Academic Explanation: ${topic}
**1. Overview:**
${topic} is an essential academic subject concept. It provides foundational mechanics across modern coursework.

**2. How It Works:**
- Operates through defined rules, architectural layers, or mathematical principles.
- Integrates with surrounding system components or theoretical frameworks.

**3. Practical Example:**
In real-world implementations, this concept is leveraged to optimize performance, manage resources, and maintain consistency.

*(Add your \`GEMINI_API_KEY\` in \`.env\` for live dynamic Gemini explanations).*`;
  }
}

module.exports = new GeminiService();
