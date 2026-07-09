const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

const AuthenticationService = require("../../src/Modules/Authentication/service").default;
const { extractTokenFromAuthorizationHeader } = require("../../src/Middlewares/Authentication");

class FakeTokenService {
  constructor() {
    this.records = [];
  }

  async create(payload) {
    const record = {
      id: this.records.length + 1,
      ...payload,
      lastUsedAt: new Date(),
      revokedAt: null,
    };
    this.records.push(record);
    return record;
  }

  async findActiveByUser(userId) {
    return this.records.filter((record) => record.userId === userId && !record.revokedAt && new Date(record.expiresAt).getTime() > Date.now());
  }

  async findByTokenId(tokenId) {
    return this.records.find((record) => record.tokenId === tokenId) ?? null;
  }

  async updateLastUsed(tokenId, expiresAt) {
    const record = this.records.find((entry) => entry.tokenId === tokenId);
    if (record) {
      record.lastUsedAt = new Date();
      record.expiresAt = expiresAt ?? new Date(Date.now() + 60 * 60 * 1000);
    }
  }

  async revoke(tokenId) {
    const record = this.records.find((entry) => entry.tokenId === tokenId);
    if (record) {
      record.revokedAt = new Date();
      return true;
    }
    return false;
  }

  async revokeAllForUser(userId) {
    let updated = 0;
    this.records.forEach((record) => {
      if (record.userId === userId && !record.revokedAt) {
        record.revokedAt = new Date();
        updated += 1;
      }
    });
    return updated;
  }

  async removeExpired() {
    const before = this.records.length;
    this.records = this.records.filter((record) => new Date(record.expiresAt).getTime() > Date.now());
    return before - this.records.length;
  }
}

const createUserLookup = () => {
  const users = [
    {
      id: "4f317c65-0153-4a7f-b1b5-4b9d4f0d9f47",
      name: "Jane Doe",
      email: "jane@example.com",
      password: bcrypt.hashSync("secret123", 10),
      phone_number: "1234567890",
    },
  ];

  return async (email) => users.find((user) => user.email === email) ?? null;
};

test("extractTokenFromAuthorizationHeader parses JWT-prefixed headers", () => {
  assert.equal(extractTokenFromAuthorizationHeader("JWT abc123"), "abc123");
  assert.equal(extractTokenFromAuthorizationHeader("jwt abc123"), "abc123");
  assert.equal(extractTokenFromAuthorizationHeader("Bearer abc123"), null);
  assert.equal(extractTokenFromAuthorizationHeader(undefined), null);
});

test("login allows two active sessions per user but rejects a third", async () => {
  const tokenService = new FakeTokenService();
  const service = new AuthenticationService(createUserLookup(), "test-secret", tokenService);

  const firstLogin = await service.login({
    email: "jane@example.com",
    password: "secret123",
    deviceId: "device-1",
  });

  const secondLogin = await service.login({
    email: "jane@example.com",
    password: "secret123",
    deviceId: "device-2",
  });

  assert.ok(firstLogin.accessToken);
  assert.ok(secondLogin.accessToken);

  await assert.rejects(
    () =>
      service.login({
        email: "jane@example.com",
        password: "secret123",
        deviceId: "device-3",
      }),
    (error) => {
      assert.equal(error.status, 403);
      assert.match(error.message, /2 devices/i);
      return true;
    }
  );
});

test("validateSession refreshes activity within one hour and expires stale sessions", async () => {
  const tokenService = new FakeTokenService();
  const service = new AuthenticationService(createUserLookup(), "test-secret", tokenService);

  const loginResponse = await service.login({
    email: "jane@example.com",
    password: "secret123",
    deviceId: "device-1",
  });

  const activeSession = await service.validateSession(loginResponse.accessToken);
  assert.ok(activeSession);

  const record = await tokenService.findByTokenId(loginResponse.tokenId);
  record.lastUsedAt = new Date(Date.now() - 61 * 60 * 1000);
  record.expiresAt = new Date(Date.now() - 1000);

  const expiredSession = await service.validateSession(loginResponse.accessToken);
  assert.equal(expiredSession, null);
});
