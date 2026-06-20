/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var email_auth_exports = {};
__export(email_auth_exports, {
  EmailAuth: () => EmailAuth
});
module.exports = __toCommonJS(email_auth_exports);
var import_auth = require("@nocobase/auth");
var import_constants = require("../constants");
class EmailAuth extends import_auth.BaseAuth {
  constructor(config) {
    const { ctx } = config;
    super({
      ...config,
      userCollection: ctx.db.getCollection("users")
    });
  }
  async validate() {
    var _a;
    const ctx = this.ctx;
    const verificationPlugin = ctx.app.pm.get("verification");
    if (!verificationPlugin) {
      ctx.log.error("auth-email: @nocobase/plugin-verification is required", {
        method: "validate"
      });
      ctx.throw(500);
    }
    let user;
    ctx.action.mergeParams({
      values: {
        verifier: (_a = this.options.public) == null ? void 0 : _a.verifier,
        action: "auth:signIn:email"
      }
    });
    const originalActionName = ctx.action.actionName;
    try {
      ctx.action.actionName = "signIn:email";
      await verificationPlugin.verificationManager.verify(ctx, async () => {
        var _a2;
        const {
          values: { uuid: email }
        } = ctx.action.params;
        try {
          user = await this.userRepository.findOne({
            filter: { email }
          });
          if (user) {
            await this.authenticator.addUser(user, {
              through: {
                uuid: email
              }
            });
            return;
          }
          const { autoSignup } = ((_a2 = this.authenticator.options) == null ? void 0 : _a2.public) || {};
          const authenticator = this.authenticator;
          if (autoSignup) {
            user = await authenticator.findOrCreateUser(email, {
              nickname: email,
              email
            });
            return;
          }
          user = await authenticator.findUser(email);
          if (!user) {
            throw new Error(ctx.t("The email is not registered, please register first", { ns: import_constants.namespace }));
          }
        } catch (err) {
          ctx.log.error(err, { method: "validate" });
          throw new Error(err.message);
        }
      });
    } finally {
      ctx.action.actionName = originalActionName;
    }
    return user;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EmailAuth
});
