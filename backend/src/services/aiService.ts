// Groq API using fetch (no SDK needed!)

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const generateTaskSuggestions = async (
  projectName: string,
  existingTasks: string[]
): Promise<string[]> => {
  try {
    console.log('🤖 Calling Groq API for project:', projectName);
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `You are a project management assistant.

Project: "${projectName}"
Existing tasks: ${existingTasks.length > 0 ? existingTasks.join(', ') : 'No tasks yet'}

Suggest 3 specific, actionable next tasks for this project.

Return ONLY a JSON array with no explanation:
["Task 1", "Task 2", "Task 3"]`
        }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Groq API error:', error);
      return [];
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    console.log('🤖 Groq raw response:', text);
    
    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed suggestions:', suggestions);
      return suggestions;
    }
    
    console.log('⚠️ Could not extract JSON from response');
    return [];
  } catch (error) {
    console.error('❌ Groq error:', error);
    return [];
  }
};

export const generateTaskDescription = async (
  taskTitle: string,
  projectName: string
): Promise<string> => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Project: "${projectName}"
Task: "${taskTitle}"

Write a clear 2-3 sentence description for this task. Be specific and actionable.
Return only the description.`
        }],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Groq error:', error);
    return '';
  }
};

export const generateProjectInsights = async (
  projectName: string,
  tasks: Array<{ title: string; status: string; priority: string }>
): Promise<string> => {
  try {
    const todoCount = tasks.filter(t => t.status === 'TODO').length;
    const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const doneCount = tasks.filter(t => t.status === 'DONE').length;
    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Project: "${projectName}"
Tasks: ${tasks.length} total (${todoCount} TODO, ${inProgressCount} IN PROGRESS, ${doneCount} DONE)
High Priority: ${highPriorityCount}

Provide brief insight (2-3 sentences) about project progress and recommendations.`
        }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ Groq error:', error);
    return '';
  }
};