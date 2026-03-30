import { useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { PAPER } from '../data/knowledgeBase';
import { QSAFE } from '../data/qsafeMetrics';

const SYSTEM_PROMPT = `You are a quantum cryptography expert analyzing a research paper and a QSafe BB84 implementation.
Always compare QSafe with BB84, B92, E91, and SGS04 where relevant.
Use concise technical language and cite concrete numbers (QBER, match rate, stage counts).`;

export function useAIAgent() {
  const { state, dispatch } = useDashboard();

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg = { role: 'user' as const, content: text };
      dispatch({ type: 'AI_MESSAGE', payload: userMsg });
      dispatch({ type: 'AI_LOADING' });

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
      if (!apiKey) {
        dispatch({
          type: 'AI_ERROR',
          payload: 'Missing VITE_ANTHROPIC_API_KEY. Add it to client/.env and restart dev server.',
        });
        return;
      }

      try {
        const messages = [...state.aiChat.messages, userMsg].map((m) => ({
          role: m.role,
          content: [{ type: 'text', text: m.content }],
        }));

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 800,
            system: `${SYSTEM_PROMPT}\n\nPaper data:\n${JSON.stringify(PAPER)}\n\nQSafe data:\n${JSON.stringify(QSAFE)}`,
            messages,
          }),
        });

        if (!response.ok) {
          throw new Error(`Anthropic API request failed (${response.status})`);
        }

        const data: { content?: Array<{ type: string; text?: string }> } = await response.json();
        const assistant =
          data.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n').trim() ||
          'No response content received.';

        dispatch({ type: 'AI_MESSAGE', payload: { role: 'assistant', content: assistant } });
      } catch (error) {
        dispatch({
          type: 'AI_ERROR',
          payload: error instanceof Error ? error.message : 'Unknown AI request error',
        });
      }
    },
    [dispatch, state.aiChat.messages],
  );

  const clearChat = useCallback(() => {
    dispatch({ type: 'AI_CLEAR' });
  }, [dispatch]);

  return {
    messages: state.aiChat.messages,
    loading: state.aiChat.loading,
    error: state.aiChat.error,
    sendMessage,
    clearChat,
  };
}
