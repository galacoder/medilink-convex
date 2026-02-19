import { describe, expect, it } from "vitest";

import {
  completionReportSchema,
  startServiceSchema,
  timeLogSchema,
  updateProgressSchema,
} from "./serviceExecution";

// ---------------------------------------------------------------------------
// startServiceSchema tests
// ---------------------------------------------------------------------------

describe("startServiceSchema", () => {
  const validInput = {
    serviceRequestId: "sr_test_001",
    actualStartTime: Date.now(),
    notes: "Bắt đầu kiểm tra thiết bị",
  };

  it("test_startServiceSchema_validInput - accepts valid start input", () => {
    const result = startServiceSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects empty serviceRequestId", () => {
    const result = startServiceSchema.safeParse({
      ...validInput,
      serviceRequestId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "ID yêu cầu dịch vụ không được để trống",
      );
    }
  });

  it("accepts optional notes", () => {
    const result = startServiceSchema.safeParse({
      serviceRequestId: "sr_test_001",
      actualStartTime: Date.now(),
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateProgressSchema tests
// ---------------------------------------------------------------------------

describe("updateProgressSchema", () => {
  const validInput = {
    serviceRequestId: "sr_test_001",
    progressNotes: "Đã kiểm tra và xác định lỗi bo mạch",
    percentComplete: 50,
  };

  it("test_updateProgressSchema_validInput - accepts valid progress update", () => {
    const result = updateProgressSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.percentComplete).toBe(50);
    }
  });

  it("rejects percentComplete greater than 100", () => {
    const result = updateProgressSchema.safeParse({
      ...validInput,
      percentComplete: 150,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Tiến độ không được vượt quá 100%",
      );
    }
  });

  it("rejects percentComplete less than 0", () => {
    const result = updateProgressSchema.safeParse({
      ...validInput,
      percentComplete: -10,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Tiến độ không được nhỏ hơn 0%",
      );
    }
  });

  it("accepts optional percentComplete", () => {
    const result = updateProgressSchema.safeParse({
      serviceRequestId: "sr_test_001",
      progressNotes: "Đang tiến hành",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short progress notes", () => {
    const result = updateProgressSchema.safeParse({
      ...validInput,
      progressNotes: "Ngắn",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Ghi chú tiến độ phải có ít nhất 10 ký tự",
      );
    }
  });
});

// ---------------------------------------------------------------------------
// completionReportSchema tests
// ---------------------------------------------------------------------------

describe("completionReportSchema", () => {
  const validInput = {
    serviceRequestId: "sr_test_001",
    workDescriptionVi: "Đã thay thế bo mạch chính và hiệu chỉnh lại thiết bị",
    partsReplaced: ["Bo mạch chính", "Cáp kết nối"],
    nextMaintenanceRecommendation:
      "Nên kiểm tra lại sau 6 tháng để đảm bảo hoạt động ổn định",
    actualHours: 3.5,
    photoUrls: [
      "https://example.com/before.jpg",
      "https://example.com/after.jpg",
    ],
  };

  it("test_completionReportSchema_validInput - accepts valid completion report", () => {
    const result = completionReportSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.actualHours).toBe(3.5);
      expect(result.data.partsReplaced).toHaveLength(2);
    }
  });

  it("rejects short work description", () => {
    const result = completionReportSchema.safeParse({
      ...validInput,
      workDescriptionVi: "Ngắn",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Mô tả công việc phải có ít nhất 20 ký tự",
      );
    }
  });

  it("rejects negative actualHours", () => {
    const result = completionReportSchema.safeParse({
      ...validInput,
      actualHours: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Số giờ thực tế phải lớn hơn 0",
      );
    }
  });

  it("accepts optional fields", () => {
    const result = completionReportSchema.safeParse({
      serviceRequestId: "sr_test_001",
      workDescriptionVi:
        "Đã hoàn thành việc sửa chữa và kiểm tra thiết bị y tế",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional english work description", () => {
    const result = completionReportSchema.safeParse({
      ...validInput,
      workDescriptionEn: "Replaced main circuit board and recalibrated device",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid photo URL", () => {
    const result = completionReportSchema.safeParse({
      ...validInput,
      photoUrls: ["not-a-valid-url"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("URL ảnh không hợp lệ");
    }
  });
});

// ---------------------------------------------------------------------------
// timeLogSchema tests
// ---------------------------------------------------------------------------

describe("timeLogSchema", () => {
  const now = Date.now();
  const validInput = {
    serviceRequestId: "sr_test_001",
    startTime: now,
    endTime: now + 3600000, // 1 hour later
    notes: "Kiểm tra và chẩn đoán thiết bị",
  };

  it("test_timeLogSchema_validInput - accepts valid time log", () => {
    const result = timeLogSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects endTime before startTime", () => {
    const result = timeLogSchema.safeParse({
      ...validInput,
      endTime: now - 1000, // before start
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Thời gian kết thúc phải sau thời gian bắt đầu",
      );
    }
  });

  it("accepts optional notes", () => {
    const result = timeLogSchema.safeParse({
      serviceRequestId: "sr_test_001",
      startTime: now,
      endTime: now + 3600000,
    });
    expect(result.success).toBe(true);
  });
});
