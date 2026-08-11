/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import AuthPlugin from '@nocobase/plugin-auth/client';
import { Options } from './Options';
import { authType } from '../constants';
import models from './models';
import SeeyonCallbackPage from './SeeyonCallbackPage';

export class PluginSeeyonAuthClient extends Plugin {
  async load() {
    this.flowEngine.registerModels(models);

    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType(authType, {
      components: {
        AdminSettingsForm: Options,
      },
    });

    this.router.add('seeyon-auth.callback', {
      path: '/seeyon-auth/callback/:rest*',
      Component: SeeyonCallbackPage,
      skipAuthCheck: true,
    });
  }
}

export default PluginSeeyonAuthClient;
