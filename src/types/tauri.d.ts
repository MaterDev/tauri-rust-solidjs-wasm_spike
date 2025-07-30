declare module '@tauri-apps/api/log' {
  export function info(message: string): Promise<void>;
  export function debug(message: string): Promise<void>;
  export function error(message: string): Promise<void>;
  export function warn(message: string): Promise<void>;
  export function trace(message: string): Promise<void>;
}
