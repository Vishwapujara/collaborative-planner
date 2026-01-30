import { GoogleGenerativeAI } from '@google/generative-ai';

// 🔍 Log SDK version once at startup (safe to keep)
console.log(
  '🧠 Gemini SDK version:',
  require('@google/generative-ai/package.json').version
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ✅ Model selection with safe default (free-tier compatible)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

/**
 * Generate task suggestions for a project
 */
export const generateTaskSuggestions = async (
  projectName: string,
  existingTasks: string[]
): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
You are a project management assistant helping a development team.

Project Name: "${projectName}"
Existing Tasks: ${existingTasks.length > 0 ? existingTasks.join(', ') : 'No tasks yet'}

Based on this project, suggest 3 specific, actionable tasks that would help move this project forward.

IMPORTANT: Return ONLY a valid JSON array of task titles. No explanation, no markdown, no backticks.
Format: ["Task 1", "Task 2", "Task 3"]

Example for "Mobile App Development":
["Design user interface mockups", "Set up authentication API", "Create database schema"]
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log('🤖 Gemini raw response:', text);

    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const suggestions = JSON.parse(jsonMatch[0]);
    return Array.isArray(suggestions) ? suggestions : [];
  } catch (error) {
    console.error('❌ Gemini API error (task suggestions):', error);
    return [];
  }
};

/**
 * Generate a short description for a task
 */
export const generateTaskDescription = async (
  taskTitle: string,
  projectName: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `
You are a project management assistant.

Project: "${projectName}"
Task Title: "${taskTitle}"

Write a clear, concise task description (2-3 sentences) explaining what needs to be done for this task.
Be specific and actionable.

Return ONLY the description text, no formatting or extra text.
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('❌ Gemini API error (task description):', error);
    return '';
  }
};

/**
 * Generate high-level project insights
 */
export const generateProjectInsights = async (
  projectName: string,
  tasks: Array<{ title: string; status: string; priority: string }>
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const todoCount = tasks.filter(t => t.status === 'TODO').length;
    const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const doneCount = tasks.filter(t => t.status === 'DONE').length;
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;

    const prompt = `
You are a project analyst.

Project: "${projectName}"
Total Tasks: ${tasks.length}
Status: ${todoCount} TODO, ${inProgressCount} IN PROGRESS, ${doneCount} DONE
High Priority: ${highPriorityCount} tasks

Provide a brief project insight (2-3 sentences) about progress, potential blockers, and recommendations.
Be encouraging but realistic.
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('❌ Gemini API error (project insights):', error);
    return '';
  }
};
