declare module "bcrypt" {
  export function hash(password: string | Buffer, salt: string | number): Promise<string>;
  export function compare(password: string | Buffer, hash: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
}
