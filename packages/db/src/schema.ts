/**
 * packages/db/src/schema.ts: Convex schema reference stub.
 *
 * The canonical schema is defined in `convex/schema.ts` at the monorepo root.
 * This file documents all 23 tables across 8 domains for IDE discoverability.
 *
 * ============================================================================
 * BASE DOMAIN (3 tables)
 * ============================================================================
 *   - organizations
 *       Fields: name, slug, org_type ("hospital"|"provider"), createdAt, updatedAt
 *       Indexes: by_type, by_slug
 *       Validators: packages/validators/src/organizations.ts
 *
 *   - organizationMemberships
 *       Fields: orgId, userId, role ("owner"|"admin"|"member"), createdAt, updatedAt
 *       Indexes: by_org, by_user, by_org_and_user
 *       Validators: packages/validators/src/organizations.ts
 *
 *   - users
 *       Fields: name, email, platformRole? ("platform_admin"|"platform_support"),
 *               createdAt, updatedAt
 *       Validators: packages/validators/src/auth.ts
 *
 * ============================================================================
 * EQUIPMENT DOMAIN (5 tables)
 * vi: "Lĩnh vực thiết bị" / en: "Equipment domain"
 * ============================================================================
 *   - equipmentCategories
 *       Fields: nameVi, nameEn, descriptionVi?, descriptionEn?,
 *               organizationId, createdAt, updatedAt
 *       Indexes: by_org
 *
 *   - equipment
 *       Fields: nameVi, nameEn, descriptionVi?, descriptionEn?, categoryId,
 *               organizationId, status, condition, criticality, serialNumber?,
 *               model?, manufacturer?, purchaseDate?, warrantyExpiryDate?,
 *               location?, createdAt, updatedAt
 *       Enums:
 *         status: "available"|"in_use"|"maintenance"|"damaged"|"retired"
 *         condition: "excellent"|"good"|"fair"|"poor"
 *         criticality: "A"|"B"|"C"
 *       Indexes: by_org, by_org_and_status, by_category, by_org_and_serialNumber
 *       Validators: packages/validators/src/equipment.ts
 *
 *   - equipmentHistory
 *       Fields: equipmentId, actionType, previousStatus?, newStatus?, notes?,
 *               performedBy, createdAt, updatedAt
 *       Enums:
 *         actionType: "status_change"|"maintenance"|"repair"|"inspection"
 *       Indexes: by_equipment, by_performed_by
 *
 *   - maintenanceRecords
 *       Fields: equipmentId, type, status, recurringPattern, scheduledAt,
 *               completedAt?, technicianId?, technicianNotes?, cost?,
 *               createdAt, updatedAt
 *       Enums:
 *         type: "preventive"|"corrective"|"inspection"|"calibration"
 *         status: "scheduled"|"in_progress"|"completed"|"overdue"|"cancelled"
 *         recurringPattern: "none"|"daily"|"weekly"|"monthly"|"quarterly"|"annually"
 *       Indexes: by_equipment, by_status, by_scheduled_at
 *       Validators: packages/validators/src/equipment.ts (createMaintenanceSchema)
 *
 *   - failureReports
 *       Fields: equipmentId, urgency, status, descriptionVi, descriptionEn?,
 *               reportedBy, assignedTo?, resolvedAt?, resolutionNotes?,
 *               createdAt, updatedAt
 *       Enums:
 *         urgency: "low"|"medium"|"high"|"critical"
 *         status: "open"|"in_progress"|"resolved"|"closed"|"cancelled"
 *       Indexes: by_equipment, by_status, by_urgency
 *       Validators: packages/validators/src/equipment.ts (createFailureReportSchema)
 *
 * ============================================================================
 * QR CODE DOMAIN (2 tables)
 * vi: "Lĩnh vực mã QR" / en: "QR code domain"
 * ============================================================================
 *   - qrCodes
 *       Fields: equipmentId, organizationId, code (unique), isActive,
 *               createdBy, createdAt, updatedAt
 *       Indexes: by_equipment, by_org, by_code
 *
 *   - qrScanLog
 *       Fields: qrCodeId, scannedBy, action, metadata?, createdAt, updatedAt
 *       Enums:
 *         action: "view"|"borrow"|"return"|"report_issue"
 *       Indexes: by_qr_code, by_scanned_by
 *
 * ============================================================================
 * PROVIDERS DOMAIN (4 tables)
 * vi: "Lĩnh vực nhà cung cấp" / en: "Providers domain"
 * ============================================================================
 *   - providers
 *       Fields: organizationId, nameVi, nameEn, companyName?, descriptionVi?,
 *               descriptionEn?, status, verificationStatus, contactEmail?,
 *               contactPhone?, address?, averageRating?, totalRatings?,
 *               completedServices?, userId?, createdAt, updatedAt
 *       Enums:
 *         status: "active"|"inactive"|"suspended"|"pending_verification"
 *         verificationStatus: "pending"|"in_review"|"verified"|"rejected"
 *       Indexes: by_org, by_status, by_verification_status
 *       Validators: packages/validators/src/providers.ts
 *
 *   - serviceOfferings
 *       Fields: providerId, specialty, descriptionVi?, descriptionEn?,
 *               priceEstimate?, turnaroundDays?, createdAt, updatedAt
 *       Enums:
 *         specialty: "general_repair"|"calibration"|"installation"|
 *                    "preventive_maint"|"electrical"|"software"|
 *                    "diagnostics"|"training"|"other"
 *       Indexes: by_provider
 *
 *   - certifications
 *       Fields: providerId, nameVi, nameEn, issuingBody?, issuedAt?,
 *               expiresAt?, documentUrl?, createdAt, updatedAt
 *       Indexes: by_provider
 *
 *   - coverageAreas
 *       Fields: providerId, region, district?, isActive, createdAt, updatedAt
 *       Indexes: by_provider
 *
 * ============================================================================
 * SERVICE REQUESTS DOMAIN (3 tables)
 * vi: "Lĩnh vực yêu cầu dịch vụ" / en: "Service requests domain"
 * ============================================================================
 *   - serviceRequests
 *       Fields: organizationId, equipmentId, requestedBy, assignedProviderId?,
 *               type, status, priority, descriptionVi, descriptionEn?,
 *               scheduledAt?, completedAt?, createdAt, updatedAt
 *       Enums:
 *         type: "repair"|"maintenance"|"calibration"|"inspection"|
 *               "installation"|"other"
 *         status: "pending"|"quoted"|"accepted"|"in_progress"|
 *                 "completed"|"cancelled"|"disputed"
 *         priority: "low"|"medium"|"high"|"critical"
 *       Indexes: by_org, by_org_and_status, by_equipment, by_provider
 *       Validators: packages/validators/src/serviceRequests.ts
 *
 *   - quotes
 *       Fields: serviceRequestId, providerId, status, amount, currency,
 *               validUntil?, notes?, createdAt, updatedAt
 *       Enums:
 *         status: "pending"|"accepted"|"rejected"|"expired"
 *       Indexes: by_service_request, by_provider
 *       Validators: packages/validators/src/serviceRequests.ts (createQuoteSchema)
 *
 *   - serviceRatings
 *       Fields: serviceRequestId, providerId, ratedBy, rating (1-5),
 *               commentVi?, commentEn?, serviceQuality?, timeliness?,
 *               professionalism?, createdAt, updatedAt
 *       Indexes: by_service_request, by_provider
 *       Validators: packages/validators/src/serviceRequests.ts (createServiceRatingSchema)
 *
 * ============================================================================
 * CONSUMABLES DOMAIN (3 tables)
 * vi: "Lĩnh vực vật tư tiêu hao" / en: "Consumables domain"
 * ============================================================================
 *   - consumables
 *       Fields: organizationId, nameVi, nameEn, descriptionVi?, descriptionEn?,
 *               sku?, manufacturer?, unitOfMeasure, categoryType, currentStock,
 *               parLevel, maxLevel?, reorderPoint, unitCost?, relatedEquipmentId?,
 *               createdAt, updatedAt
 *       Enums:
 *         categoryType: "disposables"|"reagents"|"electrodes"|"filters"|
 *                       "lubricants"|"cleaning_agents"|"other"
 *       Indexes: by_org, by_org_and_category, by_org_and_sku
 *       Validators: packages/validators/src/consumables.ts
 *
 *   - consumableUsageLog
 *       Fields: consumableId, quantity, transactionType, usedBy, equipmentId?,
 *               notes?, createdAt, updatedAt
 *       Enums:
 *         transactionType: "RECEIVE"|"USAGE"|"ADJUSTMENT"|"WRITE_OFF"|"EXPIRED"
 *       Indexes: by_consumable, by_used_by
 *
 *   - reorderRequests
 *       Fields: consumableId, organizationId, quantity, status, requestedBy,
 *               approvedBy?, notes?, createdAt, updatedAt
 *       Enums:
 *         status: "pending"|"approved"|"ordered"|"received"|"cancelled"
 *       Indexes: by_consumable, by_org, by_status
 *
 * ============================================================================
 * DISPUTES DOMAIN (2 tables)
 * vi: "Lĩnh vực tranh chấp" / en: "Disputes domain"
 * ============================================================================
 *   - disputes
 *       Fields: organizationId, serviceRequestId, raisedBy, assignedTo?,
 *               status, type, descriptionVi, descriptionEn?,
 *               resolvedAt?, resolutionNotes?, createdAt, updatedAt
 *       Enums:
 *         status: "open"|"investigating"|"resolved"|"closed"|"escalated"
 *         type: "quality"|"pricing"|"timeline"|"other"
 *       Indexes: by_org, by_org_and_status, by_service_request
 *       Validators: packages/validators/src/disputes.ts
 *
 *   - disputeMessages
 *       Fields: disputeId, authorId, contentVi, contentEn?,
 *               attachmentUrls?, createdAt, updatedAt
 *       Indexes: by_dispute, by_author
 *
 * ============================================================================
 * AUDIT LOG DOMAIN (1 table)
 * vi: "Lĩnh vực nhật ký kiểm tra" / en: "Audit log domain"
 * ============================================================================
 *   - auditLog
 *       Fields: organizationId, actorId, action (e.g. "equipment.status_changed"),
 *               resourceType (e.g. "equipment"), resourceId (Convex ID as string),
 *               previousValues?, newValues?, ipAddress?, userAgent?,
 *               createdAt, updatedAt
 *       Indexes: by_org, by_org_and_action, by_actor, by_resource
 *       Note: Vietnamese medical device regulations require 5-year retention.
 *
 * ============================================================================
 * See convex/schema.ts for complete table definitions, indexes, and field types.
 */
export {};
