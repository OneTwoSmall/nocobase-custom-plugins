/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import { namespace } from '../constants';
import { resolvePassword } from './utils';

export class SeeyonAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection('users'),
    });
  }

  async validate() {
    const ctx = this.ctx;
    const { ticket } = ctx.action.params.values || {};

    if (!ticket) {
      ctx.throw(400, {
        message: ctx.t('Ticket is required', { ns: namespace }),
      });
    }

    const username = await this.validateTicket(ticket);
    if (!username) {
      ctx.throw(401, {
        message: ctx.t('Invalid ticket or authentication failed', { ns: namespace }),
      });
    }

    const user = await this.findOrCreateUser(username);
    if (!user) {
      ctx.throw(401, {
        message: ctx.t('User not found and auto-registration is disabled', { ns: namespace }),
      });
    }

    return user;
  }

  async validateTicket(ticket: string): Promise<string | null> {
    const oaHost = this.options.public?.oaHost;
    if (!oaHost) return null;

    try {
      const response = await fetch(`${oaHost}/seeyon/thirdpartyController.do?ticket=${encodeURIComponent(ticket)}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const text = await response.text();
      if (!text || text.toLowerCase().includes('error')) return null;

      return text.trim();
    } catch {
      return null;
    }
  }

  async findOrCreateUser(username: string): Promise<Model | null> {
    const matchField = this.options.public?.matchField || 'username';
    const autoRegister = this.options.public?.autoRegister;

    let user = await this.userRepository.findOne({
      filter: { [matchField]: username },
    });

    if (!user && autoRegister) {
      const password = resolvePassword(this.options.public?.defaultPassword);
      user = await this.userRepository.create({
        values: {
          [matchField]: username,
          nickname: username,
          password,
        },
      });

      await this.authenticator.addUser(user, {
        through: { uuid: username },
      });
    }

    if (!user) return null;

    if (!(await this.authenticator.findUser(username))) {
      await this.authenticator.addUser(user, {
        through: { uuid: username },
      });
    }

    return user;
  }
}
