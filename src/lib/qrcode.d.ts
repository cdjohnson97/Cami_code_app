declare module "qrcode" {
  export function toString(
    text: string,
    options?: {
      type?: "svg";
      width?: number;
      margin?: number;
      color?: { dark: string; light: string };
    },
    cb?: (err: Error | null, str: string) => void
  ): Promise<string>;
}
