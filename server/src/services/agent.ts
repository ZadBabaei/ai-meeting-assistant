import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ExtractedActionItem {
  description: string;
  assignee: string | null;
  dueDate: string | null;
}

export interface ExtractedCRMChange {
  contactName: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
}

export interface ExtractedFollowUp {
  subject: string;
  body: string;
  to: string[];
}

export interface AgentResult {
  summary: string;
  actionItems: ExtractedActionItem[];
  crmChanges: ExtractedCRMChange[];
  followUpEmail: ExtractedFollowUp | null;
  participants: string[];
}

const EXTRACTION_SYSTEM_PROMPT = `You are an AI assistant that analyzes meeting transcripts for a financial advisory CRM system. You extract structured data from conversations.

Analyze the transcript and extract:
1. A concise summary (2-3 sentences)
2. Action items with assignees and due dates (if mentioned)
3. CRM field changes — any client data that should be updated (e.g., retirement age target, risk tolerance, income changes, family status changes, investment preferences)
4. A professional follow-up email draft
5. List of participants mentioned

Be thorough but precise. Only extract information that is clearly stated or strongly implied in the transcript. For CRM changes, focus on financial planning fields relevant to wealth management and advisory.`;

const EXTRACTION_FUNCTIONS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'save_meeting_analysis',
      description: 'Save the extracted meeting analysis data',
      parameters: {
        type: 'object',
        required: ['summary', 'actionItems', 'crmChanges', 'followUpEmail', 'participants'],
        properties: {
          summary: {
            type: 'string',
            description: 'A concise 2-3 sentence summary of the meeting',
          },
          participants: {
            type: 'array',
            items: { type: 'string' },
            description: 'Names of people who participated in or were mentioned in the meeting',
          },
          actionItems: {
            type: 'array',
            items: {
              type: 'object',
              required: ['description'],
              properties: {
                description: { type: 'string', description: 'What needs to be done' },
                assignee: { type: ['string', 'null'], description: 'Who is responsible' },
                dueDate: { type: ['string', 'null'], description: 'When it is due (ISO date format if mentioned)' },
              },
            },
          },
          crmChanges: {
            type: 'array',
            items: {
              type: 'object',
              required: ['contactName', 'fieldName', 'newValue'],
              properties: {
                contactName: { type: 'string', description: 'The client/contact this change applies to' },
                fieldName: { type: 'string', description: 'The CRM field name (e.g., "Retirement Target Age", "Risk Tolerance", "Annual Income")' },
                oldValue: { type: ['string', 'null'], description: 'Previous value if mentioned' },
                newValue: { type: 'string', description: 'New value detected from the conversation' },
              },
            },
          },
          followUpEmail: {
            type: ['object', 'null'],
            required: ['subject', 'body', 'to'],
            properties: {
              subject: { type: 'string', description: 'Email subject line' },
              body: { type: 'string', description: 'Professional email body summarizing the meeting and next steps' },
              to: {
                type: 'array',
                items: { type: 'string' },
                description: 'Recipient names (we will resolve to emails later)',
              },
            },
          },
        },
      },
    },
  },
];

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRetryable =
        error?.status === 429 ||
        error?.status === 500 ||
        error?.status === 503 ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT';

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.warn(`LLM call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry logic exhausted');
}

export async function processTranscript(transcript: string): Promise<AgentResult> {
  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `Please analyze the following meeting transcript and extract all relevant data:\n\n${transcript}` },
      ],
      tools: EXTRACTION_FUNCTIONS,
      tool_choice: { type: 'function', function: { name: 'save_meeting_analysis' } },
      temperature: 0.1,
    })
  );

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];
  if (!toolCall || toolCall.type !== 'function' || toolCall.function.name !== 'save_meeting_analysis') {
    throw new Error('LLM did not return expected function call');
  }

  const result = JSON.parse(toolCall.function.arguments) as AgentResult;
  return result;
}
