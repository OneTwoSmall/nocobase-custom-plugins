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
var smtp_exports = {};
__export(smtp_exports, {
  SMTPProvider: () => SMTPProvider
});
module.exports = __toCommonJS(smtp_exports);
var import_index = require("./index");
var import_nodemailer = __toESM(require("nodemailer"));
class SMTPProvider extends import_index.EmailProvider {
  transporter;
  constructor(options) {
    super(options);
    this.transporter = import_nodemailer.default.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: {
        user: options.user,
        pass: options.pass
      }
    });
  }
  async send(receiver, data) {
    const { code, expiresIn } = data;
    let { subject, html } = this.options;
    const replacements = {
      code,
      expires: Math.ceil(expiresIn / 60)
      // minutes
    };
    subject = subject.replace(
      /\[(\w+)\]/g,
      (match, key) => key in replacements ? String(replacements[key]) : match
    );
    html = html.replace(
      /\[(\w+)\]/g,
      (match, key) => key in replacements ? String(replacements[key]) : match
    );
    const mailOptions = {
      from: this.options.from,
      to: receiver,
      subject,
      html
    };
    return await this.transporter.sendMail(mailOptions);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SMTPProvider
});
