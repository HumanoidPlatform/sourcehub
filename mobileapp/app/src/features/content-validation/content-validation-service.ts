import type { ContentValidationStatus, PreliminaryContentValidationResult, Task } from '@/types/domain';

export type VideoFrameSample = {
  description: string;
  tags: string[];
  timestampMs: number;
};

export type VideoFrameSamplerInput = {
  durationMs?: number;
  fileName: string;
  localUri: string;
};

export type ContentValidationInput = {
  durationMs?: number;
  fileName: string;
  localUri: string;
  task: Pick<Task, 'checklist' | 'description' | 'id' | 'qualityBar' | 'title'>;
};

export type ContentValidationService = {
  validateVideo(input: ContentValidationInput): Promise<PreliminaryContentValidationResult>;
};

export type VideoFrameSampler = {
  sampleFrames(input: VideoFrameSamplerInput): Promise<VideoFrameSample[]>;
};

const roadRequirementTerms = ['road', 'traffic', 'driving', 'vehicle', 'signal', 'safety', 'mobility'];
const kitchenMismatchTerms = ['vegetable', 'kitchen', 'cutting', 'cooking', 'knife', 'chopping'];
const industryRequirementTerms = [
  'industrial',
  'industry',
  'manufacturing',
  'machinery',
  'machine',
  'equipment',
  'factory',
  'operation',
  'conveyor',
  'motor',
  'inspection',
];
const workshopAmbiguousTerms = ['workshop', 'tools', 'bench', 'maintenance'];

export class MockVideoFrameSampler implements VideoFrameSampler {
  async sampleFrames(input: VideoFrameSamplerInput): Promise<VideoFrameSample[]> {
    const searchable = `${input.fileName} ${input.localUri}`.toLowerCase();
    const durationMs = input.durationMs ?? 15_000;
    const timestamps = [0.2, 0.5, 0.8].map((ratio) => Math.round(durationMs * ratio));
    const tags = inferMockTags(searchable);

    return timestamps.map((timestampMs, index) => ({
      description: tags.includes('kitchen')
        ? `Mock frame ${index + 1}: cutting board, vegetables and indoor kitchen counter visible.`
        : tags.includes('road')
          ? `Mock frame ${index + 1}: public road scene with lane, traffic signal and moving vehicles.`
          : tags.includes('industrial')
            ? `Mock frame ${index + 1}: industrial machinery and factory equipment visible during normal operation.`
            : tags.includes('workshop')
              ? `Mock frame ${index + 1}: workshop tools and bench area visible, but equipment operation is unclear.`
              : `Mock frame ${index + 1}: ambiguous outdoor scene without enough task-specific context.`,
      tags,
      timestampMs,
    }));
  }
}

export class MockContentValidationService implements ContentValidationService {
  constructor(private readonly sampler: VideoFrameSampler = new MockVideoFrameSampler()) {}

  async validateVideo(input: ContentValidationInput): Promise<PreliminaryContentValidationResult> {
    const frames = await this.sampler.sampleFrames(input);
    const requirementSummary = summarizeRequirement(input.task);
    const taskProfile = getMockTaskProfile(requirementSummary);
    const requirementTerms = extractTerms(
      requirementSummary,
      taskProfile === 'industry' ? industryRequirementTerms : roadRequirementTerms,
    );
    const frameTags = new Set(frames.flatMap((frame) => frame.tags));
    const mismatchTags = kitchenMismatchTerms.filter((term) => frameTags.has(term));
    const matchedTerms = requirementTerms.filter((term) => frameTags.has(term));

    let status: ContentValidationStatus = 'UNCERTAIN';
    let confidence = 0.56;
    let reason = 'Mock validation could not confidently verify task-specific video content. Human QA should review if continued.';

    if (taskProfile === 'industry' && (hasAny(frameTags, roadRequirementTerms) || mismatchTags.length >= 2)) {
      const observed = hasAny(frameTags, roadRequirementTerms) ? 'road or driving' : mismatchTags.slice(0, 3).join(', ');
      status = 'MISMATCH';
      confidence = 0.9;
      reason = `Mock frames show ${observed} content, which does not match ${requirementSummary}.`;
    } else if (taskProfile === 'industry' && hasAny(frameTags, workshopAmbiguousTerms) && !hasAny(frameTags, industryRequirementTerms)) {
      status = 'UNCERTAIN';
      confidence = 0.58;
      reason = 'Mock frames show an ambiguous workshop scene without enough visible industrial equipment for automatic demo validation.';
    } else if (mismatchTags.length >= 2 && requirementTerms.length > 0) {
      status = 'MISMATCH';
      confidence = 0.91;
      reason = `Mock frames show ${mismatchTags.slice(0, 3).join(', ')} content, which does not match ${requirementSummary}.`;
    } else if (matchedTerms.length >= Math.min(2, Math.max(requirementTerms.length, 1))) {
      status = 'MATCH';
      confidence = 0.88;
      reason = `Mock frames include ${matchedTerms.slice(0, 3).join(', ')} context matching ${requirementSummary}.`;
    }

    return {
      checkedAt: new Date().toISOString(),
      confidence,
      frameSampleCount: frames.length,
      mocked: true,
      provider: 'mock',
      reason,
      requirementSummary,
      status,
    };
  }
}

export function canUploadWithValidation(result?: PreliminaryContentValidationResult, override = false) {
  if (!result) {
    return false;
  }
  return result.status === 'MATCH' || (result.status === 'UNCERTAIN' && override);
}

function inferMockTags(searchable: string) {
  if (kitchenMismatchTerms.some((term) => searchable.includes(term))) {
    return ['kitchen', 'vegetable', 'cutting', 'knife', 'indoor'];
  }
  if (workshopAmbiguousTerms.some((term) => searchable.includes(term))) {
    return ['workshop', 'tools', 'bench', 'maintenance', 'uncertain'];
  }
  if (industryRequirementTerms.some((term) => searchable.includes(term))) {
    return ['industrial', 'machinery', 'factory', 'equipment', 'operation'];
  }
  if (roadRequirementTerms.some((term) => searchable.includes(term))) {
    return ['road', 'traffic', 'driving', 'vehicle', 'signal', 'safety'];
  }
  return ['outdoor', 'motion', 'uncertain'];
}

function getMockTaskProfile(requirementSummary: string) {
  const lower = requirementSummary.toLowerCase();
  if (industryRequirementTerms.some((term) => lower.includes(term))) {
    return 'industry' as const;
  }
  return 'road' as const;
}

function hasAny(tags: Set<string>, terms: string[]) {
  return terms.some((term) => tags.has(term));
}

function summarizeRequirement(task: ContentValidationInput['task']) {
  return [task.title, task.description, task.qualityBar, ...task.checklist].join(' ').replace(/\s+/g, ' ').trim();
}

function extractTerms(value: string, terms: string[]) {
  const lower = value.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

export const contentValidationService: ContentValidationService = new MockContentValidationService();
