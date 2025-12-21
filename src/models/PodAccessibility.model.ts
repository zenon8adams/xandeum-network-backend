import mongoose, { Schema, Document } from 'mongoose';

export interface IPodAccessibility extends Document {
  podId: string;
  endpoint: string;
  isAccessible: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
  expiresAt: Date;
}

const podAccessibilitySchema = new Schema<IPodAccessibility>(
  {
    podId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    isAccessible: {
      type: Boolean,
      required: true,
    },
    lastChecked: {
      type: Date,
      required: true,
      default: Date.now,
    },
    responseTime: {
      type: Number,
      required: false,
    },
    error: {
      type: String,
      required: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    },
  },
  {
    timestamps: true,
  }
);

// Create TTL index to automatically delete old entries after 1 hour
podAccessibilitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create compound index for efficient queries
podAccessibilitySchema.index({ podId: 1, lastChecked: -1 });

export const PodAccessibility = mongoose.model<IPodAccessibility>(
  'PodAccessibility',
  podAccessibilitySchema
);
