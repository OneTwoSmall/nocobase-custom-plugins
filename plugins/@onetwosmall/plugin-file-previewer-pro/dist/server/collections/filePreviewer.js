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
var filePreviewer_exports = {};
__export(filePreviewer_exports, {
  default: () => filePreviewer_default
});
module.exports = __toCommonJS(filePreviewer_exports);
var filePreviewer_default = {
  dumpRules: "required",
  name: "filePreviewer",
  migrationRules: ["overwrite", "skip"],
  fields: [
    {
      type: "string",
      name: "previewType",
      defaultValue: "microsoft"
    },
    {
      type: "string",
      name: "kkFileViewUrl",
      defaultValue: "http://localhost:8012"
    },
    {
      type: "string",
      name: "kkFileViewExtensions"
    },
    {
      type: "string",
      name: "customExtensions"
    },
    {
      type: "string",
      name: "basemetasUrl",
      defaultValue: "http://localhost:9000"
    }
  ]
};
