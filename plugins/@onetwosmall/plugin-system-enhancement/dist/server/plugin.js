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
var plugin_exports = {};
__export(plugin_exports, {
  PluginSystemEnhancementServer: () => PluginSystemEnhancementServer,
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_server = require("@nocobase/server");
class PluginSystemEnhancementServer extends import_server.Plugin {
  async afterAdd() {
  }
  async beforeLoad() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.settings`,
      actions: ["systemEnhancementSettings:*"]
    });
    this.app.acl.allow("systemEnhancementSettings", ["get", "update"], "loggedIn");
  }
  async load() {
  }
  async install() {
  }
  async afterEnable() {
    try {
      const repo = this.db.getRepository("systemEnhancementSettings");
      const count = await repo.count();
      if (count === 0) {
        await repo.create({ values: { id: 1, enableTableColumnResize: true } });
      }
    } catch {
    }
  }
  async afterDisable() {
  }
  async remove() {
  }
}
var plugin_default = PluginSystemEnhancementServer;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PluginSystemEnhancementServer
});
