/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

"use strict";(self.webpackChunk_onetwosmall_plugin_auth_email_client_v2=self.webpackChunk_onetwosmall_plugin_auth_email_client_v2||[]).push([["319"],{802:function(e,a,t){t.r(a),t.d(a,{BindForm:function(){return u}});var l=t(59),n=t(155),r=t.n(n),i=t(17),m=t(488);function u(e){var a=e.verifier,t=e.actionType,n=e.isLogged,u=(0,m.Tr)().t,s=l.Form.useFormInstance(),o=l.Form.useWatch("uuid",s);return r().createElement(r().Fragment,null,r().createElement(l.Form.Item,{name:"uuid",label:u("Email"),rules:[{required:!0,message:u("Please fill in your email address")},{type:"email",message:u("Not a valid email address, please re-enter")}]},r().createElement(l.Input,null)),r().createElement(l.Form.Item,{name:"code",label:u("Verification code"),rules:[{required:!0,message:u("Please enter the verification code")}]},r().createElement(i.n,{actionType:t,verifier:a,email:o,isLogged:n})))}a.default=u}}]);