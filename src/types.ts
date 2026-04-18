export interface TransformState {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface KeychainItem {
  id: string;
  resi: string;
  name: string;
  textColor: string;
  outlineColor: string;
  bgColor: string;
  fontFamily: string;
  useOutline: boolean;
  outlineWidth: number;
  textScale: number;
  textRotation: number;
  textPos: { x: number; y: number };
  transform: TransformState;
  imgW: number;
  imgH: number;
  previewUrl: string;
  file?: File;
  imageData?: string;
}

export type SidebarTab = 'massal' | 'individu';
