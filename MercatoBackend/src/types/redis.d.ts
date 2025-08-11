// Type declarations for Redis pipeline results
declare module 'redis' {
  interface RedisCommandsReply {
    [key: string]: any;
  }
}
