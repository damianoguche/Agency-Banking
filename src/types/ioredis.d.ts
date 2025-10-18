import "ioredis";

declare module "ioredis" {
  interface RedisCommander<Context> {
    set(
      key: string,
      value: string | Buffer | number,
      options?: {
        EX?: number;
        PX?: number;
        NX?: boolean;
        XX?: boolean;
        KEEPTTL?: boolean;
      }
    ): Promise<"OK" | null>;
  }
}
