import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { odpApi } from '@/api';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { processUploadQueue } from '@/services/upload-queue';

export function useQueueProcessor() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  const { isOnline } = useNetworkStatus();
  const processingRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    let cancelled = false;

    async function process() {
      if (processingRef.current) {
        return;
      }
      processingRef.current = true;
      try {
        await processUploadQueue(odpApi, {
          shouldContinue: () => !cancelled,
        });
        await queryClient.invalidateQueries({ queryKey: ['uploadQueue'] });
      } catch (error) {
        if (!cancelled) {
          feedback.showError(getSafeFeedbackMessage(error, 'Upload queue processing failed. Please retry.'));
        }
      } finally {
        processingRef.current = false;
      }
    }

    process();
    const interval = setInterval(process, 7000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [feedback, isOnline, queryClient]);
}
