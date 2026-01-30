import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const generateTaskSuggestions = async (
  projectName: string,
  existingTasks: string[]
): Promise<string[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
You are a project management assistant. 

Project Name: "${projectName}"
Existing Tasks: ${existingTasks.length > 0 ? existingTasks.join(', ') : 'None yet'}

Based on this project, suggest 3 logical next tasks that would help complete this project.

IMPORTANT: Return ONLY a valid JSON array of task titles, nothing else.
Format: ["Task title 1", "Task title 2", "Task title 3"]

Example for a "Mobile App" project:
["Design user interface mockups", "Set up authentication system", "Create database schema"]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Gemini API error:', error);
    return [];
  }
};

export const generateTaskDescription = async (
  taskTitle: string,
  projectName: string
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
You are a project management assistant.

Project: "${projectName}"
Task Title: "${taskTitle}"

Write a clear, concise task description (2-3 sentences) explaining what needs to be done for this task.
Be specific and actionable.

Return ONLY the description text, no formatting or extra text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return '';
  }
};

export const generateProjectInsights = async (
  projectName: string,
  tasks: Array<{ title: string; status: string; priority: string }>
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return '';
  }
};