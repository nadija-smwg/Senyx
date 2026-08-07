export interface DeviceInfo {
  device: string | null;
  os: string | null;
  browser: string | null;
  userAgent: string | null;
}

export interface AuthContext {
  userId: string;
  employeeId?: string;
  roles: string[];
  permissions: { module: string; action: string; scope: string }[];
  sessionId: string;
  deviceInfo: DeviceInfo;
  ip: string | null;
  apiRoute: string;
}
