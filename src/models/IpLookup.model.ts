import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * IP Lookup document interface
 */
export interface IIpLookup extends Document {
  ip: string;
  data: Record<string, any>;
  queriedAt: Date;
  expiresAt: Date;
}

/**
 * IP Lookup schema
 */
const ipLookupSchema = new Schema<IIpLookup>(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    queriedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'ip_lookups',
  }
);

// Create TTL index for automatic document expiration
ipLookupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * IP Lookup model
 */
export const IpLookup: Model<IIpLookup> = mongoose.model<IIpLookup>('IpLookup', ipLookupSchema);
