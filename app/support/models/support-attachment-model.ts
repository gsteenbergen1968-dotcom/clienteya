import type {
  SupportEntity,
  SupportMessageId,
  SupportUserId,
} from "./support-model";

export type SupportAttachmentType =
  | "image"
  | "document"
  | "spreadsheet"
  | "audio"
  | "video"
  | "other";

export type SupportAttachmentStatus =
  | "uploading"
  | "available"
  | "failed"
  | "deleted";

export type SupportAttachment = SupportEntity & {
  messageId: SupportMessageId;

  fileName: string;
  fileType: SupportAttachmentType;
  mimeType: string;
  fileSize: number;
  storagePath: string;

  status: SupportAttachmentStatus;

  uploadedByUserId?: SupportUserId;

  checksum?: string;
  deletedAt?: string;
};