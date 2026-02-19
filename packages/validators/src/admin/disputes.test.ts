/**
 * Unit tests for platform admin dispute arbitration validator schemas.
 *
 * vi: "Kiểm tra validator cho trọng tài tranh chấp quản trị viên"
 * en: "Platform admin dispute arbitration validator tests"
 */
import { describe, expect, it } from "vitest";

import {
  adminServiceRequestFiltersSchema,
  arbitrationResolutionSchema,
  arbitrationRulingSchema,
  arbitrationRulingWithRefinementSchema,
  providerReassignmentSchema,
} from "./disputes";

// ===========================================================================
// arbitrationResolutionSchema
// ===========================================================================
describe("arbitrationResolutionSchema", () => {
  it("test_valid_resolution_types_accepted", () => {
    const validTypes = ["refund", "partial_refund", "dismiss", "re_assign"];
    for (const type of validTypes) {
      const result = arbitrationResolutionSchema.safeParse(type);
      expect(result.success).toBe(true);
    }
  });

  it("test_invalid_resolution_type_rejected", () => {
    const result = arbitrationResolutionSchema.safeParse("unknown_action");
    expect(result.success).toBe(false);
  });
});

// ===========================================================================
// arbitrationRulingSchema
// ===========================================================================
describe("arbitrationRulingSchema", () => {
  it("test_valid_ruling_passes", () => {
    const result = arbitrationRulingSchema.safeParse({
      disputeId: "abc123",
      resolution: "refund",
      reasonVi: "Nhà cung cấp không hoàn thành công việc",
      reasonEn: "Provider did not complete work",
    });
    expect(result.success).toBe(true);
  });

  it("test_partial_refund_with_amount_passes", () => {
    const result = arbitrationRulingSchema.safeParse({
      disputeId: "abc123",
      resolution: "partial_refund",
      reasonVi: "Công việc hoàn thành một phần",
      refundAmount: 500000,
    });
    expect(result.success).toBe(true);
  });

  it("test_reason_vi_too_short_fails", () => {
    const result = arbitrationRulingSchema.safeParse({
      disputeId: "abc123",
      resolution: "dismiss",
      reasonVi: "Quá ngắn",
    });
    expect(result.success).toBe(false);
  });

  it("test_missing_dispute_id_fails", () => {
    const result = arbitrationRulingSchema.safeParse({
      resolution: "dismiss",
      reasonVi: "Khiếu nại không có căn cứ hợp lý",
    });
    expect(result.success).toBe(false);
  });

  it("test_negative_refund_amount_fails", () => {
    const result = arbitrationRulingSchema.safeParse({
      disputeId: "abc123",
      resolution: "partial_refund",
      reasonVi: "Công việc hoàn thành một phần",
      refundAmount: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ===========================================================================
// arbitrationRulingWithRefinementSchema
// ===========================================================================
describe("arbitrationRulingWithRefinementSchema", () => {
  it("test_partial_refund_without_amount_fails_refinement", () => {
    const result = arbitrationRulingWithRefinementSchema.safeParse({
      disputeId: "abc123",
      resolution: "partial_refund",
      reasonVi: "Công việc hoàn thành một phần",
    });
    expect(result.success).toBe(false);
  });

  it("test_refund_without_amount_passes_refinement", () => {
    const result = arbitrationRulingWithRefinementSchema.safeParse({
      disputeId: "abc123",
      resolution: "refund",
      reasonVi: "Nhà cung cấp không hoàn thành công việc",
    });
    expect(result.success).toBe(true);
  });

  it("test_dismiss_without_amount_passes_refinement", () => {
    const result = arbitrationRulingWithRefinementSchema.safeParse({
      disputeId: "abc123",
      resolution: "dismiss",
      reasonVi: "Khiếu nại không có cơ sở pháp lý",
    });
    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// providerReassignmentSchema
// ===========================================================================
describe("providerReassignmentSchema", () => {
  it("test_valid_reassignment_passes", () => {
    const result = providerReassignmentSchema.safeParse({
      serviceRequestId: "sr123",
      newProviderId: "prov456",
      reasonVi: "Nhà cung cấp cũ không đáp ứng yêu cầu",
      reasonEn: "Original provider failed to meet requirements",
    });
    expect(result.success).toBe(true);
  });

  it("test_missing_service_request_id_fails", () => {
    const result = providerReassignmentSchema.safeParse({
      newProviderId: "prov456",
      reasonVi: "Nhà cung cấp cũ không đáp ứng yêu cầu",
    });
    expect(result.success).toBe(false);
  });

  it("test_reason_vi_too_short_fails", () => {
    const result = providerReassignmentSchema.safeParse({
      serviceRequestId: "sr123",
      newProviderId: "prov456",
      reasonVi: "Ngắn",
    });
    expect(result.success).toBe(false);
  });
});

// ===========================================================================
// adminServiceRequestFiltersSchema
// ===========================================================================
describe("adminServiceRequestFiltersSchema", () => {
  it("test_empty_filters_valid", () => {
    const result = adminServiceRequestFiltersSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("test_valid_status_filter", () => {
    const result = adminServiceRequestFiltersSchema.safeParse({
      status: "disputed",
    });
    expect(result.success).toBe(true);
  });

  it("test_invalid_status_filter_fails", () => {
    const result = adminServiceRequestFiltersSchema.safeParse({
      status: "unknown_status",
    });
    expect(result.success).toBe(false);
  });

  it("test_date_range_filter_valid", () => {
    const result = adminServiceRequestFiltersSchema.safeParse({
      fromDate: 1700000000000,
      toDate: 1800000000000,
    });
    expect(result.success).toBe(true);
  });

  it("test_bottleneck_only_flag_valid", () => {
    const result = adminServiceRequestFiltersSchema.safeParse({
      showBottlenecksOnly: true,
    });
    expect(result.success).toBe(true);
  });
});
