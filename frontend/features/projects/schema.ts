import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Tên dự án là bắt buộc")
    .max(100, "Tên dự án tối đa 100 ký tự"),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Tên dự án là bắt buộc")
    .max(100, "Tên dự án tối đa 100 ký tự"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
