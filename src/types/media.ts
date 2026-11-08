export interface MachineryMedia {
  id: string;
  type: 'MODEL_3D' | 'VIEW_360' | 'VIDEO';
  title: string;
  fileType: string;
  fileSize: number;
  position: number;
  createdAt: string;
  state?: 'ACTIVE' | 'DELETING' | 'UPLOADING';
}
