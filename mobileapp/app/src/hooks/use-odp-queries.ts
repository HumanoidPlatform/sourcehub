import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { odpApi } from '@/api';
import { getSafeFeedbackMessage } from '@/features/feedback/error-messages';
import { useFeedback } from '@/features/feedback/feedback-provider';
import { selectWorkflowRevision, useWorkflowStore } from '@/store/workflow-store';
import type { CreateAppealInput, CreateSubmissionInput, DemoPersona, WithdrawInput } from '@/types/domain';

export function useHomeSummary() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getHomeSummary,
    queryKey: ['homeSummary', workflowRevision],
  });
}

export function useAvailableTasks() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getAvailableTasks,
    queryKey: ['tasks', 'available', workflowRevision],
  });
}

export function useMyTasks() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getMyTasks,
    queryKey: ['tasks', 'mine', workflowRevision],
  });
}

export function useTask(id: string) {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    enabled: Boolean(id),
    queryFn: () => odpApi.getTask(id),
    queryKey: ['task', id, workflowRevision],
  });
}

export function useStartTask() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (id: string) => odpApi.startTask(id),
    onSuccess: async (task) => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      await queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      await queryClient.invalidateQueries({ queryKey: ['homeSummary'] });
      feedback.showSuccess('Task accepted successfully');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to accept this task.'));
    },
  });
}

export function useNotifications() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getNotifications,
    queryKey: ['notifications', workflowRevision],
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (id: string) => odpApi.markNotificationRead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      feedback.showSuccess('Notification marked as read');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not update notification.'));
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: odpApi.markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      feedback.showSuccess('Notifications marked as read');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not update notifications.'));
    },
  });
}

export function useCertifications() {
  return useQuery({
    queryFn: odpApi.getCertifications,
    queryKey: ['certifications'],
  });
}

export function useLearningModules() {
  return useQuery({
    queryFn: odpApi.getLearningModules,
    queryKey: ['learningModules'],
  });
}

export function useKitCustody() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getKitCustody,
    queryKey: ['kitCustody', workflowRevision],
  });
}

export function useWallet() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getWallet,
    queryKey: ['wallet', workflowRevision],
  });
}

export function useWithdrawWallet() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (input: WithdrawInput) => odpApi.withdrawWallet(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallet'] });
      feedback.showSuccess('Payout request submitted');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to request payout'));
    },
  });
}

export function useCreateSubmission() {
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (input: CreateSubmissionInput) => odpApi.createSubmission(input),
    onSuccess: () => {
      feedback.showSuccess('Submission submitted successfully');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not submit. Please try again.'));
    },
  });
}

export function useAppeals() {
  return useQuery({
    queryFn: odpApi.getAppeals,
    queryKey: ['appeals'],
  });
}

export function useCreateAppeal() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (input: CreateAppealInput) => odpApi.createAppeal(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appeals'] });
      feedback.showSuccess('Appeal submitted successfully');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Could not submit appeal. Please try again.'));
    },
  });
}

export function useAcceptSubmission() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (submissionId: string) => odpApi.acceptSubmission(submissionId),
    onSuccess: async (asset) => {
      await queryClient.invalidateQueries({ queryKey: ['protectedMediaAsset', asset.submissionId] });
      if (asset.watermarkStatus === 'READY') {
        feedback.showSuccess('Watermarked video is ready');
      } else if (asset.watermarkStatus === 'PROCESSING') {
        feedback.showInfo('Preparing protected video');
      } else {
        feedback.showSuccess('Submission accepted');
      }
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Unable to prepare watermarked video'));
    },
  });
}

export function useProtectedMediaAsset(submissionId: string | undefined, persona: DemoPersona | undefined) {
  return useQuery({
    enabled: Boolean(submissionId && persona),
    queryFn: () => odpApi.getProtectedMediaAsset(submissionId ?? '', persona ?? 'crowd'),
    queryKey: ['protectedMediaAsset', submissionId, persona],
  });
}

export function useExportOriginal() {
  const queryClient = useQueryClient();
  const feedback = useFeedback();
  return useMutation({
    mutationFn: (input: { adminUserId: string; reason: string; submissionId: string }) => odpApi.exportOriginal(input),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['originalExportAuditEvents'] });
      await queryClient.invalidateQueries({ queryKey: ['protectedMediaAsset', response.submissionId] });
      feedback.showSuccess('Original export authorized');
    },
    onError: (error) => {
      feedback.showError(getSafeFeedbackMessage(error, 'Admin action failed. Please try again.'));
    },
  });
}

export function useOriginalExportAuditEvents() {
  const workflowRevision = useWorkflowRevision();
  return useQuery({
    queryFn: odpApi.getOriginalExportAuditEvents,
    queryKey: ['originalExportAuditEvents', workflowRevision],
  });
}

function useWorkflowRevision() {
  return useWorkflowStore(selectWorkflowRevision);
}
