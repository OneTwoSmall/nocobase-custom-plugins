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
  PluginFilePreviewerOfficeServer: () => PluginFilePreviewerOfficeServer,
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_server = require("@nocobase/server");
var collections = __toESM(require("./collections"));
class PluginFilePreviewerOfficeServer extends import_server.Plugin {
  async afterAdd() {
  }
  async beforeLoad() {
  }
  async load() {
    Object.values(collections).forEach((collection) => {
      this.db.collection(collection);
    });
    this.app.acl.allow("filePreviewer", "list");
    this.app.acl.allow("filePreviewer", "get");
    this.app.acl.allow("filePreviewer", "update");
    this.app.acl.allow("filePreviewer", "create");
  }
  async install() {
    const repository = this.db.getRepository("filePreviewer");
    const exists = await repository.findOne();
    if (!exists) {
      await repository.create({
        values: {
          previewType: "microsoft",
          kkFileViewUrl: "http://localhost:8012"
        }
      });
    }
  }
  async afterEnable() {
  }
  async afterDisable() {
  }
  async remove() {
  }
}
var plugin_default = PluginFilePreviewerOfficeServer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginFilePreviewerOfficeServer
});
