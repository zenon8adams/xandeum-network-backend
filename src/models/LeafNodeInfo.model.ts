import { Schema, model, Document } from 'mongoose';
import { LeafNodeInfo } from '@/modules/pnode/types';

export interface LeafNodeInfoDocument extends LeafNodeInfo, Document {
  queriedAt: Date;
}

const LeafNodeInfoSchema = new Schema<LeafNodeInfoDocument>({
  pubkey: { type: String, required: true },
  is_registered: { type: Boolean, required: true },
  address: {
    endpoint: { type: String, required: true },
    ip_info: { type: Schema.Types.Mixed },
  },
  accessible_node_detail: { type: Schema.Types.Mixed },
  is_accessible: { type: Boolean, required: true },
  is_public: { type: Boolean, required: true },
  is_online: { type: Boolean, required: true },
  last_seen: { type: Number, required: true },
  storage_committed: { type: Number, required: true },
  storage_used: { type: Number, required: true },
  usage_percent: { type: Number, required: true },
  uptime: { type: Number, required: true },
  version: { type: String, required: true },
  credit: { type: Number },
  credit_rank: { type: Number },
  queriedAt: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
  strict: false
});

export const LeafNodeInfoModel = model<LeafNodeInfoDocument>('LeafNodeInfo', LeafNodeInfoSchema);
