import { Schema, model, Document } from 'mongoose';
import { RootNodeInfo } from '@/modules/pnode/types';

export interface RootNodeInfoDocument extends RootNodeInfo, Document {
  queriedAt: Date;
}

const RootNodeInfoSchema = new Schema<RootNodeInfoDocument>({
  total_pods: { type: Number, required: true },
  total_storage_committed: { type: Number, required: true },
  total_storage_used: { type: Number, required: true },
  average_storage_per_pod: { type: Number, required: true },
  utilization_rate: { type: Number, required: true },
  total_credits: { type: Number },
  queriedAt: { type: Date, default: Date.now, index: true },
}, {
  timestamps: true,
  strict: false // allow extra fields for future AI search
});

export const RootNodeInfoModel = model<RootNodeInfoDocument>('RootNodeInfo', RootNodeInfoSchema);
