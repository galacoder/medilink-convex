/**
 * Tests for PhotoUpload component.
 *
 * WHY: Verifies that:
 * - Drop zone renders with correct label
 * - File input accepts correct MIME types
 * - Invalid file types trigger error message
 * - Oversized files trigger error message
 * - Upload callback is called for valid files
 * - Upload progress state is reflected in UI
 *
 * vi: "Kiem tra tai anh len vat tu" / en: "Photo upload component tests"
 */
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));

// Mock the Convex generated API
vi.mock("convex/_generated/api", () => ({
  api: {
    consumablePhotos: {
      generateUploadUrl: "consumablePhotos:generateUploadUrl",
      savePhoto: "consumablePhotos:savePhoto",
      deletePhoto: "consumablePhotos:deletePhoto",
      listPhotos: "consumablePhotos:listPhotos",
      getPhotoUrl: "consumablePhotos:getPhotoUrl",
    },
  },
}));

import { renderWithProviders } from "~/test-utils";
import { PhotoUpload } from "../PhotoUpload";

describe("PhotoUpload", () => {
  let mockOnUpload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUpload = vi.fn().mockResolvedValue(undefined);
  });

  it("test_PhotoUpload_renders_drop_zone", () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    expect(
      screen.getByText(/Keo tha hoac nhan de chon anh/),
    ).toBeInTheDocument();
  });

  it("test_PhotoUpload_renders_file_type_instructions", () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    expect(screen.getByText(/JPEG, PNG, WebP/)).toBeInTheDocument();
    expect(screen.getByText(/toi da 5MB/)).toBeInTheDocument();
  });

  it("test_PhotoUpload_renders_uploading_state", () => {
    renderWithProviders(
      <PhotoUpload onUpload={mockOnUpload} isUploading={true} />,
    );

    expect(screen.getByText(/Dang tai len/)).toBeInTheDocument();
  });

  it("test_PhotoUpload_has_accessible_button_role", () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    const dropZone = screen.getByRole("button", {
      name: /Tai anh len/i,
    });
    expect(dropZone).toBeInTheDocument();
  });

  it("test_PhotoUpload_calls_onUpload_for_valid_jpeg", async () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it("test_PhotoUpload_calls_onUpload_for_valid_png", async () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    const file = new File(["test"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it("test_PhotoUpload_rejects_invalid_file_type", async () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    // Create a PDF file (invalid for photo upload)
    const file = new File(["test"], "document.pdf", {
      type: "application/pdf",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Loai tep khong hop le/),
      ).toBeInTheDocument();
    });

    // onUpload should NOT have been called
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it("test_PhotoUpload_rejects_oversized_file", async () => {
    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    // Create a file > 5MB
    const largeContent = new ArrayBuffer(6 * 1024 * 1024); // 6MB
    const file = new File([largeContent], "large.jpg", {
      type: "image/jpeg",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Kich thuoc tep vuot qua 5MB/),
      ).toBeInTheDocument();
    });

    // onUpload should NOT have been called
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it("test_PhotoUpload_shows_upload_error", async () => {
    mockOnUpload.mockRejectedValue(new Error("Upload failed"));

    renderWithProviders(<PhotoUpload onUpload={mockOnUpload} />);

    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });
  });
});
