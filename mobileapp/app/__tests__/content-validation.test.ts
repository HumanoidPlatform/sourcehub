import { describe, expect, it } from '@jest/globals';

import { MockContentValidationService, canUploadWithValidation } from '@/features/content-validation/content-validation-service';
import type { Task } from '@/types/domain';

const roadTask = {
  checklist: ['Record a steady 10-20 second clip.'],
  description: 'Capture public-road conditions for a safety data initiative.',
  id: 'task-traffic-video',
  qualityBar: 'Stable clip, road context visible.',
  title: 'Short road-safety video',
} satisfies Pick<Task, 'checklist' | 'description' | 'id' | 'qualityBar' | 'title'>;

const industryTask = {
  checklist: [
    'Keep machinery in frame.',
    'Capture normal operating conditions where safe.',
    'Do not include unrelated footage.',
  ],
  description:
    'Record industrial machinery or equipment during normal operation while keeping the equipment clearly visible throughout the recording.',
  id: 'task-industrial-equipment-video',
  qualityBar: 'Adequate lighting, steady framing, equipment visible, no unrelated footage.',
  title: 'Industrial Equipment Inspection Video',
} satisfies Pick<Task, 'checklist' | 'description' | 'id' | 'qualityBar' | 'title'>;

describe('content validation service', () => {
  it('returns MATCH for task-relevant road video samples', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'traffic-road-signal.mp4',
      localUri: 'file:///tmp/traffic-road-signal.mp4',
      task: roadTask,
    });

    expect(result.status).toBe('MATCH');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.mocked).toBe(true);
  });

  it('returns MISMATCH for unrelated vegetable cutting video samples', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'vegetable-cutting-kitchen.mp4',
      localUri: 'file:///tmp/vegetable-cutting-kitchen.mp4',
      task: roadTask,
    });

    expect(result.status).toBe('MISMATCH');
    expect(result.reason).toContain('vegetable');
  });

  it('returns UNCERTAIN when sampled frames are not specific enough', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'generic-motion.mp4',
      localUri: 'file:///tmp/generic-motion.mp4',
      task: roadTask,
    });

    expect(result.status).toBe('UNCERTAIN');
    expect(result.confidence).toBeLessThan(0.7);
  });

  it('allows uploads only for MATCH or controlled UNCERTAIN continuation', () => {
    expect(canUploadWithValidation({ checkedAt: '', confidence: 0.88, frameSampleCount: 3, mocked: true, provider: 'mock', reason: '', requirementSummary: '', status: 'MATCH' })).toBe(true);
    expect(canUploadWithValidation({ checkedAt: '', confidence: 0.56, frameSampleCount: 3, mocked: true, provider: 'mock', reason: '', requirementSummary: '', status: 'UNCERTAIN' })).toBe(false);
    expect(canUploadWithValidation({ checkedAt: '', confidence: 0.56, frameSampleCount: 3, mocked: true, provider: 'mock', reason: '', requirementSummary: '', status: 'UNCERTAIN' }, true)).toBe(true);
    expect(canUploadWithValidation({ checkedAt: '', confidence: 0.91, frameSampleCount: 3, mocked: true, provider: 'mock', reason: '', requirementSummary: '', status: 'MISMATCH' }, true)).toBe(false);
  });

  it('returns MATCH for Industry machinery footage', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'industrial-machinery-factory-equipment.mp4',
      localUri: 'file:///tmp/industrial-machinery-factory-equipment.mp4',
      task: industryTask,
    });

    expect(result.status).toBe('MATCH');
    expect(result.reason).toContain('industrial');
  });

  it('returns MISMATCH for road-driving footage on the Industry task', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'road-driving-traffic.mp4',
      localUri: 'file:///tmp/road-driving-traffic.mp4',
      task: industryTask,
    });

    expect(result.status).toBe('MISMATCH');
    expect(result.reason).toContain('road or driving');
  });

  it('returns MISMATCH for vegetable cutting on the Industry task', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'vegetable-cutting-kitchen.mp4',
      localUri: 'file:///tmp/vegetable-cutting-kitchen.mp4',
      task: industryTask,
    });

    expect(result.status).toBe('MISMATCH');
    expect(result.reason).toContain('vegetable');
  });

  it('returns UNCERTAIN for ambiguous workshop footage on the Industry task', async () => {
    const result = await new MockContentValidationService().validateVideo({
      fileName: 'workshop-tools-maintenance.mp4',
      localUri: 'file:///tmp/workshop-tools-maintenance.mp4',
      task: industryTask,
    });

    expect(result.status).toBe('UNCERTAIN');
    expect(result.reason).toContain('ambiguous workshop');
  });
});
