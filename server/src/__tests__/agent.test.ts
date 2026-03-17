import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must use vi.hoisted so the mock fn exists before vi.mock hoists
const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: mockCreate,
      },
    };
  },
}));

import { processTranscript, type AgentResult } from '../services/agent.js';

const SAMPLE_TRANSCRIPT = `
Sarah (Advisor): Good morning John, thanks for coming in today. Let's review your portfolio.
John (Client): Thanks Sarah. I've been thinking about my retirement timeline.
Sarah: Last time we spoke, you were targeting age 65. Has that changed?
John: Yes, I'd like to move that up to 62 if possible. My wife and I want to travel while we're still young.
Sarah: That's doable, but we'll need to increase your monthly contributions. Currently you're at $2,000/month.
John: I can go up to $3,000/month. Also, I got a raise — my income is now $185,000.
Sarah: Great, congratulations! I'll update your file. Let me also adjust your risk tolerance — given the shorter timeline, we should shift from aggressive to moderate growth.
John: Sounds good. Can you also send me the updated projections by Friday?
Sarah: Absolutely. I'll have those ready and send a follow-up email with everything we discussed.
`;

const MOCK_AGENT_RESULT: AgentResult = {
  summary: 'John and Sarah reviewed his retirement plan. John wants to retire at 62 instead of 65 and can increase monthly contributions to $3,000. His income increased to $185,000.',
  participants: ['Sarah', 'John'],
  actionItems: [
    {
      description: 'Send updated retirement projections to John',
      assignee: 'Sarah',
      dueDate: null,
    },
    {
      description: 'Increase monthly contributions from $2,000 to $3,000',
      assignee: 'John',
      dueDate: null,
    },
  ],
  crmChanges: [
    {
      contactName: 'John',
      fieldName: 'Retirement Target Age',
      oldValue: '65',
      newValue: '62',
    },
    {
      contactName: 'John',
      fieldName: 'Monthly Contributions',
      oldValue: '$2,000',
      newValue: '$3,000',
    },
    {
      contactName: 'John',
      fieldName: 'Annual Income',
      oldValue: null,
      newValue: '$185,000',
    },
    {
      contactName: 'John',
      fieldName: 'Risk Tolerance',
      oldValue: 'Aggressive',
      newValue: 'Moderate Growth',
    },
  ],
  followUpEmail: {
    subject: 'Follow-up: Portfolio Review and Retirement Plan Updates',
    body: 'Hi John,\n\nThank you for meeting today. Here is a summary of what we discussed...',
    to: ['John'],
  },
};

describe('processTranscript', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('should extract structured data from a transcript via function calling', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            type: 'function',
            function: {
              name: 'save_meeting_analysis',
              arguments: JSON.stringify(MOCK_AGENT_RESULT),
            },
          }],
        },
      }],
    });

    const result = await processTranscript(SAMPLE_TRANSCRIPT);

    expect(result.summary).toBeTruthy();
    expect(result.actionItems).toHaveLength(2);
    expect(result.crmChanges).toHaveLength(4);
    expect(result.followUpEmail).not.toBeNull();
    expect(result.participants).toContain('John');
    expect(result.participants).toContain('Sarah');
  });

  it('should include correct CRM field changes', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            type: 'function',
            function: {
              name: 'save_meeting_analysis',
              arguments: JSON.stringify(MOCK_AGENT_RESULT),
            },
          }],
        },
      }],
    });

    const result = await processTranscript(SAMPLE_TRANSCRIPT);

    const retirementChange = result.crmChanges.find(c => c.fieldName === 'Retirement Target Age');
    expect(retirementChange).toBeDefined();
    expect(retirementChange!.oldValue).toBe('65');
    expect(retirementChange!.newValue).toBe('62');

    const incomeChange = result.crmChanges.find(c => c.fieldName === 'Annual Income');
    expect(incomeChange).toBeDefined();
    expect(incomeChange!.newValue).toBe('$185,000');
  });

  it('should throw when LLM returns no tool calls', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'No tool calls here',
          tool_calls: undefined,
        },
      }],
    });

    await expect(processTranscript(SAMPLE_TRANSCRIPT)).rejects.toThrow(
      'LLM did not return expected function call'
    );
  });

  it('should throw when LLM returns wrong function name', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            type: 'function',
            function: {
              name: 'wrong_function',
              arguments: '{}',
            },
          }],
        },
      }],
    });

    await expect(processTranscript(SAMPLE_TRANSCRIPT)).rejects.toThrow(
      'LLM did not return expected function call'
    );
  });

  it('should generate a follow-up email with subject and body', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            type: 'function',
            function: {
              name: 'save_meeting_analysis',
              arguments: JSON.stringify(MOCK_AGENT_RESULT),
            },
          }],
        },
      }],
    });

    const result = await processTranscript(SAMPLE_TRANSCRIPT);

    expect(result.followUpEmail?.subject).toContain('Follow-up');
    expect(result.followUpEmail?.body).toBeTruthy();
    expect(result.followUpEmail?.to).toContain('John');
  });
});
