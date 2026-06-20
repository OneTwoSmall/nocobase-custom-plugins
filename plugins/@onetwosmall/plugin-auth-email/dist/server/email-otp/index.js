/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var email_otp_exports = {};
__export(email_otp_exports, {
  EmailOTPProviderManager: () => EmailOTPProviderManager,
  EmailOTPVerification: () => EmailOTPVerification
});
module.exports = __toCommonJS(email_otp_exports);
var import_utils = require("@nocobase/utils");
var import_plugin_verification = require("@nocobase/plugin-verification");
var import_crypto = require("crypto");
var import_plugin = __toESM(require("../plugin"));
var import_dayjs = __toESM(require("dayjs"));
class EmailOTPProviderManager {
  providers = new import_utils.Registry();
  registerProvider(type, options) {
    this.providers.register(type, options);
  }
  listProviders() {
    return Array.from(this.providers.getEntities()).map(([providerType, options]) => ({
      name: providerType,
      title: options.title
    }));
  }
}
class EmailOTPVerification extends import_plugin_verification.Verification {
  getBoundInfo(userId) {
    return super.getBoundInfo(userId);
  }
  codeLength = 6;
  codeType = "numeric";
  // 'numeric', 'alpha', 'alphanumeric'
  expiresIn = 120;
  resendInterval = 60;
  maxVerifyAttempts = 5;
  constructor(props) {
    super(props);
    const { options } = props;
    this.codeLength = options.codeLength || this.codeLength;
    this.codeType = options.codeType || this.codeType;
    this.expiresIn = options.expiresIn || this.expiresIn;
    this.resendInterval = options.resendInterval || this.resendInterval;
  }
  async verify({ resource, action, boundInfo, verifyParams }) {
    const { uuid: receiver } = boundInfo;
    const code = verifyParams.code;
    if (!code) {
      return this.ctx.throw(400, "Verification code is invalid");
    }
    const plugin = this.ctx.app.pm.get(import_plugin.default);
    const counter = plugin.emailOTPCounter;
    const key = `${resource}:${action}:${receiver}`;
    let attempts = 0;
    try {
      attempts = await counter.get(key);
    } catch (e) {
      this.ctx.logger.error(e.message, {
        module: "verification",
        submodule: "email-otp",
        method: "verify",
        receiver,
        action: `${resource}:${action}`
      });
      this.ctx.throw(500, "Internal Server Error");
    }
    if (attempts > this.maxVerifyAttempts) {
      this.ctx.throw(429, this.ctx.t("Too many failed attempts. Please request a new verification code."));
    }
    const repo = this.ctx.db.getRepository("otpRecords");
    const item = await repo.findOne({
      filter: {
        receiver,
        action: `${resource}:${action}`,
        code,
        expiresAt: {
          $dateAfter: /* @__PURE__ */ new Date()
        },
        status: import_plugin_verification.CODE_STATUS_UNUSED,
        verifierName: this.verifier.name
      }
    });
    if (!item) {
      let attempts2 = 0;
      try {
        let ttl = this.expiresIn * 1e3;
        const record = await repo.findOne({
          filter: {
            action: `${resource}:${action}`,
            receiver,
            status: import_plugin_verification.CODE_STATUS_UNUSED,
            expiresAt: {
              $dateAfter: /* @__PURE__ */ new Date()
            }
          }
        });
        if (record) {
          ttl = (0, import_dayjs.default)(record.get("expiresAt")).diff((0, import_dayjs.default)());
        }
        attempts2 = await counter.incr(key, ttl);
      } catch (e) {
        this.ctx.logger.error(e.message, {
          module: "verification",
          submodule: "totp-authenticator",
          method: "verify",
          receiver,
          action: `${resource}:${action}`
        });
        this.ctx.throw(500, "Internal Server Error");
      }
      if (attempts2 > this.maxVerifyAttempts) {
        this.ctx.throw(429, this.ctx.t("Too many failed attempts. Please request a new verification code"));
      }
      return this.ctx.throw(400, {
        code: "InvalidVerificationCode",
        message: this.ctx.t("Verification code is invalid")
      });
    }
    await counter.reset(key);
    return { codeInfo: item };
  }
  async bind(userId, resource, action) {
    const { uuid, code } = this.ctx.action.params.values || {};
    await this.verify({
      resource: resource || "verifiers",
      action: action || "bind",
      boundInfo: { uuid },
      verifyParams: { code }
    });
    return { uuid };
  }
  async onActionComplete({ verifyResult }) {
    const { codeInfo } = verifyResult;
    await codeInfo.update({
      status: import_plugin_verification.CODE_STATUS_USED
    });
  }
  generateCode() {
    const length = this.codeLength;
    const type = this.codeType;
    let charset = "0123456789";
    if (type === "alpha") {
      charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    } else if (type === "alphanumeric") {
      charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    }
    let code = "";
    for (let i = 0; i < length; i++) {
      code += charset.charAt((0, import_crypto.randomInt)(charset.length));
    }
    return code;
  }
  async getProvider() {
    const { provider: providerType, settings } = this.options;
    if (!providerType) {
      return null;
    }
    const plugin = this.ctx.app.pm.get(import_plugin.default);
    const providerOptions = plugin.emailOTPProviderManager.providers.get(providerType);
    if (!providerOptions) {
      return null;
    }
    const Provider = providerOptions.provider;
    if (!Provider) {
      return null;
    }
    const options = this.ctx.app.environment.renderJsonTemplate(settings);
    return new Provider(options);
  }
  async getPublicBoundInfo(userId) {
    const boundInfo = await this.getBoundInfo(userId);
    if (!boundInfo) {
      return { bound: false };
    }
    const { uuid: email } = boundInfo;
    const [local, domain] = email.split("@");
    return {
      bound: true,
      publicInfo: local.slice(0, 2) + "*".repeat(local.length - 2) + "@" + domain
    };
  }
  async validateBoundInfo({ uuid: email }) {
    if (!email) {
      throw new Error(this.ctx.t("Not a valid email address, please re-enter"));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(this.ctx.t("Not a valid email address, please re-enter"));
    }
    return true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EmailOTPProviderManager,
  EmailOTPVerification
});
