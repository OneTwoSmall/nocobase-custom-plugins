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
var plugin_exports = {};
__export(plugin_exports, {
  PluginAuthEmailServer: () => PluginAuthEmailServer,
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_server = require("@nocobase/server");
var import_constants = require("../constants");
var import_email_auth = require("./email-auth");
var import_utils = require("@nocobase/utils");
var import_email_otp = require("./email-otp");
var import_email_otp_providers = __toESM(require("./email-otp/resource/email-otp-providers"));
var import_email_otp2 = __toESM(require("./email-otp/resource/email-otp"));
var import_smtp = require("./email-otp/providers/smtp");
const EMAIL_OTP_VERIFICATION_TYPE = "email-otp";
class PluginAuthEmailServer extends import_server.Plugin {
  emailOTPProviderManager = new import_email_otp.EmailOTPProviderManager();
  emailOTPCounter;
  afterAdd() {
    this.app.on("afterLoad", async () => {
      this.emailOTPCounter = await this.app.cacheManager.createCounter(
        {
          name: "emailOTPCounter",
          prefix: "email-otp:attempts"
        },
        this.app.lockManager
      );
    });
  }
  async load() {
    const verificationPlugin = this.app.pm.get("verification");
    if (!verificationPlugin) {
      this.app.logger.warn("auth-email: @nocobase/plugin-verification is required");
      return;
    }
    verificationPlugin.verificationManager.registerAction("auth:signIn:email", {
      manual: true,
      getBoundInfoFromCtx: (ctx) => {
        return ctx.action.params.values || {};
      }
    });
    this.app.authManager.registerTypes(import_constants.authType, {
      auth: import_email_auth.EmailAuth,
      title: (0, import_utils.tval)("Email", { ns: import_constants.namespace })
    });
    verificationPlugin.verificationManager.registerVerificationType(EMAIL_OTP_VERIFICATION_TYPE, {
      title: (0, import_utils.tval)("Email OTP", { ns: import_constants.namespace }),
      description: (0, import_utils.tval)("Get one-time codes sent to your email to complete authentication requests.", {
        ns: import_constants.namespace
      }),
      bindingRequired: true,
      verification: import_email_otp.EmailOTPVerification
    });
    verificationPlugin.verificationManager.addSceneRule(
      (scene, verificationType) => ["auth-email", "unbind-verifier"].includes(scene) && verificationType === EMAIL_OTP_VERIFICATION_TYPE
    );
    this.emailOTPProviderManager.registerProvider("smtp", {
      title: (0, import_utils.tval)("SMTP", { ns: import_constants.namespace }),
      provider: import_smtp.SMTPProvider
    });
    this.app.resourceManager.define(import_email_otp_providers.default);
    this.app.resourceManager.define(import_email_otp2.default);
    this.app.acl.allow("emailOTP", "create", "loggedIn");
    this.app.acl.allow("emailOTP", "publicCreate");
  }
  async install(options) {
  }
  async afterEnable() {
  }
  async afterDisable() {
    const verificationPlugin = this.app.pm.get("verification");
    if (!verificationPlugin) {
      return;
    }
    const verifiers = await this.app.db.getRepository("verifiers").find({
      filter: {
        verificationType: [EMAIL_OTP_VERIFICATION_TYPE]
      }
    });
    if (verifiers && verifiers.length) {
      const names = verifiers.map((v) => v.name).join(", ");
      throw new Error(
        `Cannot disable plugin ${this.name}: found verifiers still using '${EMAIL_OTP_VERIFICATION_TYPE}': ${names}. Please remove them first.`
      );
    }
  }
  async remove() {
  }
}
var plugin_default = PluginAuthEmailServer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginAuthEmailServer
});
