import { z } from "zod/v4";

/**
 * Schema for provider starting a service (transitioning to in_progress).
 *
 * WHY: When a provider arrives on-site, they must explicitly start the service
 * to update real-time status for the hospital. Recording the actual start time
 * enables accurate time tracking for hourly-priced services.
 *
 * vi: "Bắt đầu thực hiện dịch vụ" / en: "Start service execution"
 */
export const startServiceSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  // vi: "Thời gian bắt đầu thực tế" / en: "Actual start time" (epoch ms)
  actualStartTime: z.number().positive({
    message: "Thời gian bắt đầu không hợp lệ (Start time is invalid)",
  }),
  // vi: "Ghi chú ban đầu" / en: "Initial notes"
  notes: z.string().optional(),
});

/**
 * Schema for provider updating service progress in real-time.
 *
 * WHY: Hospital staff need visibility into provider progress while equipment
 * is being serviced on-site. Progress notes create a communication trail and
 * optional percentComplete gives a quick visual indicator.
 *
 * vi: "Cập nhật tiến độ dịch vụ" / en: "Update service progress"
 */
export const updateProgressSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  // vi: "Ghi chú tiến độ" / en: "Progress notes"
  progressNotes: z.string().min(10, {
    message:
      "Ghi chú tiến độ phải có ít nhất 10 ký tự (Progress notes must be at least 10 characters)",
  }),
  // vi: "Phần trăm hoàn thành" / en: "Percent complete" (0-100)
  percentComplete: z
    .number()
    .min(0, {
      message:
        "Tiến độ không được nhỏ hơn 0% (Progress cannot be less than 0%)",
    })
    .max(100, {
      message: "Tiến độ không được vượt quá 100% (Progress cannot exceed 100%)",
    })
    .optional(),
  // vi: "Cờ vấn đề bất ngờ" / en: "Flag unexpected issue"
  hasUnexpectedIssue: z.boolean().optional(),
  // vi: "Mô tả vấn đề bất ngờ" / en: "Unexpected issue description"
  unexpectedIssueDescVi: z.string().optional(),
});

/**
 * Schema for provider submitting a completion report.
 *
 * WHY: Completion reports are stored as structured data (not free text) so
 * M3-4 analytics can aggregate parts replaced, actual hours, and maintenance
 * schedules across all completed services. Bilingual descriptions ensure
 * hospital staff can read the report in their preferred language.
 *
 * vi: "Báo cáo hoàn thành dịch vụ" / en: "Service completion report"
 */
export const completionReportSchema = z.object({
  serviceRequestId: z.string().min(1, {
    message:
      "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
  }),
  // vi: "Mô tả công việc đã thực hiện (tiếng Việt)" / en: "Work description (Vietnamese)"
  workDescriptionVi: z.string().min(20, {
    message:
      "Mô tả công việc phải có ít nhất 20 ký tự (Work description must be at least 20 characters)",
  }),
  // vi: "Mô tả công việc đã thực hiện (tiếng Anh)" / en: "Work description (English)"
  workDescriptionEn: z.string().optional(),
  // vi: "Danh sách linh kiện đã thay thế" / en: "List of parts replaced"
  partsReplaced: z.array(z.string()).optional(),
  // vi: "Khuyến nghị bảo trì tiếp theo" / en: "Next maintenance recommendation"
  nextMaintenanceRecommendation: z.string().optional(),
  // vi: "Số giờ thực tế" / en: "Actual hours spent"
  actualHours: z
    .number()
    .positive({
      message:
        "Số giờ thực tế phải lớn hơn 0 (Actual hours must be greater than 0)",
    })
    .optional(),
  // vi: "URL ảnh tài liệu" / en: "Photo documentation URLs"
  photoUrls: z
    .array(
      z.string().url({
        message: "URL ảnh không hợp lệ (Invalid photo URL)",
      }),
    )
    .optional(),
  // vi: "Thời gian hoàn thành thực tế" / en: "Actual completion time" (epoch ms)
  actualCompletionTime: z.number().positive().optional(),
});

/**
 * Schema for logging time spent on a service (for hourly pricing).
 *
 * WHY: Providers with hourly pricing need to log time blocks to justify their
 * invoice. Time logs provide an audit trail that hospitals can verify and that
 * M3-4 analytics can use for labor cost tracking.
 *
 * vi: "Ghi nhật ký thời gian làm việc" / en: "Log work time"
 */
export const timeLogSchema = z
  .object({
    serviceRequestId: z.string().min(1, {
      message:
        "ID yêu cầu dịch vụ không được để trống (Service request ID is required)",
    }),
    // vi: "Thời gian bắt đầu" / en: "Start time" (epoch ms)
    startTime: z.number().positive({
      message: "Thời gian bắt đầu không hợp lệ (Start time is invalid)",
    }),
    // vi: "Thời gian kết thúc" / en: "End time" (epoch ms)
    endTime: z.number().positive({
      message: "Thời gian kết thúc không hợp lệ (End time is invalid)",
    }),
    // vi: "Ghi chú công việc" / en: "Work notes"
    notes: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message:
      "Thời gian kết thúc phải sau thời gian bắt đầu (End time must be after start time)",
    path: ["endTime"],
  });

// TypeScript type inference exports
export type StartServiceInput = z.infer<typeof startServiceSchema>;
export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CompletionReportInput = z.infer<typeof completionReportSchema>;
export type TimeLogInput = z.infer<typeof timeLogSchema>;
