import { z } from 'zod';

const devEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), 'Enter a valid email');

export const loginSchema = z.object({
  email: devEmailSchema,
  persona: z.enum(['platform', 'client', 'tenant', 'aggregator', 'qa', 'partner', 'sponsor', 'crowd', 'ide', 'builder']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  workerCode: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    confirmPassword: z.string().min(10, 'Confirm your password'),
    email: devEmailSchema,
    firstName: z.string().min(1, 'Enter your first name').max(80, 'Keep first name under 80 characters'),
    lastName: z.string().min(1, 'Enter your last name').max(80, 'Keep last name under 80 characters'),
    password: z.string().min(10, 'Use at least 10 characters'),
    phone: z.string().min(7, 'Enter a valid phone number').max(40, 'Phone number is too long'),
    termsAccepted: z.boolean().refine((value) => value, 'Accept the terms to continue'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const annotationSchema = z.object({
  label: z.string().min(2, 'Add a label before submitting'),
  notes: z.string().max(280, 'Keep notes under 280 characters').optional(),
});

export type AnnotationFormValues = z.infer<typeof annotationSchema>;

export const transcriptionSchema = z.object({
  transcript: z.string().min(8, 'Transcript is too short'),
  speakerContext: z.string().max(120, 'Keep context short').optional(),
});

export type TranscriptionFormValues = z.infer<typeof transcriptionSchema>;

export const surveySchema = z.object({
  assetId: z.string().min(3, 'Enter a rack or asset identifier'),
  condition: z.enum(['good', 'damaged', 'missing', 'unsafe']),
  notes: z.string().min(4, 'Add a short observation'),
});

export type SurveyFormValues = z.infer<typeof surveySchema>;

export const ratingSchema = z.object({
  preference: z.enum(['A', 'B', 'tie']),
  rubric: z.enum(['accuracy', 'safety', 'helpfulness']),
  justification: z.string().min(12, 'Add a clear justification'),
});

export type RatingFormValues = z.infer<typeof ratingSchema>;

export const withdrawSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+$/, 'Enter a whole amount')
    .refine((value) => Number(value) >= 100, 'Minimum withdrawal is 100')
    .refine((value) => Number(value) <= 50000, 'Amount is above the V1 limit'),
});

export type WithdrawFormValues = z.infer<typeof withdrawSchema>;

export const appealSchema = z.object({
  ground: z.string().min(12, 'Explain why QA should review this submission'),
  submissionId: z.string().min(4, 'Enter a submission ID'),
});

export type AppealFormValues = z.infer<typeof appealSchema>;
