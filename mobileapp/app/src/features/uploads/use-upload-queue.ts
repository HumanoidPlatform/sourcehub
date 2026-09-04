import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { odpApi } from '@/api';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import {
  createUploadQueueItem,
  getUploadQueueItem,
  allowUncertainUploadQueueItem,
  listUploadQueueItems,
  processUploadQueueItem,
  retryUploadQueueItem,
  saveUploadQueueItemValidation,
} from '@/services/upload-queue';
import type { CreateUploadQueueItemInput, PreliminaryContentValidationResult } from '@/types/domain';

export function useUploadQueue() {
  return useQuery({
    queryFn: listUploadQueueItems,
    queryKey: ['uploadQueue'],
    refetchInterval: 1500,
  });
}

export function useUploadQueueItem(id: string) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => getUploadQueueItem(id),
    queryKey: ['uploadQueue', id],
    refetchInterval: 1000,
  });
}

export function useCreateUploadQueueItem() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (input: CreateUploadQueueItemInput) => createUploadQueueItem(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue'] });
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not prepare media for upload.'));
    },
  });
}

export function useStartUpload() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (id: string) => processUploadQueueItem(id, odpApi),
    onMutate: () => {
      feedback.showInfo('Upload started');
    },
    onSuccess: async (_item, id) => {
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue', id] });
      showUploadCompletionFeedback(feedback, _item);
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Upload failed. Please retry.'));
    },
  });
}

export function useSaveUploadValidation() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: ({ id, result, override }: { id: string; override?: boolean; result: PreliminaryContentValidationResult }) =>
      saveUploadQueueItemValidation(id, result, { override }),
    onSuccess: async (_item, { id }) => {
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue', id] });
      showSemanticFeedback(feedback, _item?.preliminaryValidation);
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not verify this video.'));
    },
  });
}

export function useAllowUncertainUpload() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (id: string) => allowUncertainUploadQueueItem(id),
    onSuccess: async (_item, id) => {
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue', id] });
      feedback.showInfo('Continuing with manual review');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not continue with this video.'));
    },
  });
}

export function useRetryUpload() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: async (id: string) => {
      await retryUploadQueueItem(id);
      return processUploadQueueItem(id, odpApi);
    },
    onMutate: () => {
      feedback.showInfo('Upload started');
    },
    onSuccess: async (_item, id) => {
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue'] });
      await queryClient.invalidateQueries({ queryKey: ['uploadQueue', id] });
      showUploadCompletionFeedback(feedback, _item);
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Upload failed. Please retry.'));
    },
  });
}

function showSemanticFeedback(feedback: ReturnType<typeof useFeedback>, result?: PreliminaryContentValidationResult) {
  if (!result) {
    return;
  }
  if (result.status === 'MATCH') {
    feedback.showSuccess('Video matches the task requirements');
  } else if (result.status === 'UNCERTAIN') {
    feedback.showWarning('We could not confidently verify this video');
  } else {
    feedback.showError('Video does not match the task requirements');
  }
}

function showUploadCompletionFeedback(feedback: ReturnType<typeof useFeedback>, item: Awaited<ReturnType<typeof processUploadQueueItem>>) {
  if (!item) {
    feedback.showError('Upload failed. Please retry.');
    return;
  }
  if (item.status === 'failed' || item.resultStatus === 'failed') {
    feedback.showError('Upload failed. Please retry.');
    return;
  }
  if (item.resultStatus === 'possible_duplicate' || item.mockQcStatus === 'POSSIBLE_DUPLICATE') {
    feedback.showWarning('Video uploaded and flagged for review');
    return;
  }
  if (item.status === 'uploaded') {
    feedback.showSuccess(item.kind === 'video' ? 'Video uploaded successfully' : 'Media uploaded successfully');
  }
}
