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
  default: () => email_otp_default
});
module.exports = __toCommonJS(email_otp_exports);
var import_dayjs = __toESM(require("dayjs"));
var import_crypto = require("crypto");
var import_plugin = __toESM(require("../../plugin"));
var import_constants = require("../../../constants");
const CODE_STATUS_UNUSED = 0;
const CODE_STATUS_USED = 1;
async function create(ctx, next) {
  var _a;
  const { action: actionName, verifier: verifierName } = ((_a = ctx.action.params) == null ? void 0 : _a.values) || {};
  const plugin = ctx.app.pm.get(import_plugin.default);
  const verificationManager = ctx.app.pm.get("verification").verificationManager;
  const action = verificationManager.actions.get(actionName);
  if (!action) {
    return ctx.throw(400, "Invalid action type");
  }
  if (!verifierName) {
    return ctx.throw(400, "Invalid verifier");
  }
  const verifier = await ctx.db.getRepository("verifiers").findOne({
    filter: {
      name: verifierName
    }
  });
  if (!verifier) {
    return ctx.throw(400, "Invalid verifier");
  }
  const Verification = verificationManager.getVerification(verifier.verificationType);
  const verification = new Verification({
    ctx,
    verifier,
    options: verifier.options
  });
  const provider = await verification.getProvider();
  if (!provider) {
    ctx.log.error(`[verification] no provider for action (${actionName}) provided`);
    return ctx.throw(500, "Invalid provider");
  }
  const { boundInfo } = await verificationManager.getAndValidateBoundInfo(ctx, action, verification);
  const { uuid: receiver } = boundInfo;
  const record = await ctx.db.getRepository("otpRecords").findOne({
    filter: {
      action: actionName,
      receiver,
      createdAt: {
        $gt: (0, import_dayjs.default)().subtract(verification.resendInterval, "second").toDate()
      }
    },
    order: [["createdAt", "DESC"]]
  });
  if (record) {
    const seconds = (0, import_dayjs.default)(record.get("createdAt")).add(verification.resendInterval, "second").diff((0, import_dayjs.default)(), "seconds");
    return ctx.throw(429, {
      code: "RateLimit",
      message: ctx.t("Please don't retry in {{time}} seconds", { time: seconds, ns: import_constants.namespace })
    });
  }
  const code = verification.generateCode();
  try {
    await provider.send(receiver, {
      code,
      expiresIn: verification.expiresIn
    });
  } catch (error) {
    ctx.logger.error(error, { method: "emailOTP.create" });
    switch (error.code) {
      case "ECONNECTION":
        return ctx.throw(500, ctx.t("SMTP connection failed, please check SMTP settings", { ns: import_constants.namespace }));
      case "EAUTH":
        return ctx.throw(
          500,
          ctx.t("SMTP authentication failed, please check username and password", { ns: import_constants.namespace })
        );
      case "InvalidReceiver":
        return ctx.throw(400, {
          code: "InvalidReceiver",
          message: ctx.t("Not a valid email address, please re-enter", { ns: import_constants.namespace })
        });
      case "RateLimit":
        return ctx.throw(429, ctx.t("You are trying so frequently, please slow down", { ns: import_constants.namespace }));
      default:
        ctx.log.error(error);
        return ctx.throw(
          500,
          ctx.t("Verification send failed, please try later or contact to administrator", { ns: import_constants.namespace })
        );
    }
  }
  const result = await ctx.db.getRepository("otpRecords").create({
    values: {
      id: (0, import_crypto.randomUUID)(),
      action: actionName,
      receiver,
      code,
      expiresAt: Date.now() + (verification.expiresIn ?? 60) * 1e3,
      status: CODE_STATUS_UNUSED,
      verifierName
    }
  });
  ctx.body = {
    id: result.id,
    expiresAt: result.expiresAt,
    resendInterval: verification.resendInterval
  };
  return next();
}
var email_otp_default = {
  name: "emailOTP",
  actions: {
    create,
    publicCreate: create
  }
};
