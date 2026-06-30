import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { RedisService } from '../../../redis/redis.service';

export interface AssignmentTokenPayload {
  assignmentId: string;
  caseId: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
}

const TOKEN_PREFIX = 'follow-up:assignment-token:';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Generates and validates the single-use tokens used in the Confirm/Decline
 * buttons of the case-assignment email, so a teacher can respond with one
 * click and no login.
 *
 * NOTE: this assumes RedisService exposes `set(key, value, ttlSeconds)`,
 * `get(key)`, and `del(key)`. Adjust the `create()` call below if your
 * RedisService's set() signature differs (e.g. a separate expire() call).
 */
@Injectable()
export class AssignmentTokenService {
  private readonly logger = new Logger(AssignmentTokenService.name);

  constructor(private readonly redis: RedisService) {}

  async create(payload: AssignmentTokenPayload): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await this.redis.set(
      `${TOKEN_PREFIX}${token}`,
      JSON.stringify(payload),
      TOKEN_TTL_SECONDS,
    );
    return token;
  }

  /**
   * Looks up and immediately deletes the token (single-use), so the same
   * email link can't be clicked twice or replayed after the case has moved
   * on. Returns null if the token doesn't exist, already used, or expired.
   */
  async consume(token: string): Promise<AssignmentTokenPayload | null> {
    const key = `${TOKEN_PREFIX}${token}`;
    const raw = await this.redis.get(key);
    if (!raw) return null;

    await this.redis.del(key);

    try {
      return JSON.parse(raw as string) as AssignmentTokenPayload;
    } catch {
      this.logger.error(`Corrupt assignment token payload for token ${token}`);
      return null;
    }
  }
}