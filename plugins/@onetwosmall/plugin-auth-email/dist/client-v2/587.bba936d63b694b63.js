/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

"use strict";(self.webpackChunk_onetwosmall_plugin_auth_email_client_v2=self.webpackChunk_onetwosmall_plugin_auth_email_client_v2||[]).push([["587"],{182:function(e,i,a){a.r(i),a.d(i,{VerificationForm:function(){return o}});var l=a(59),n=a(155),t=a.n(n),r=a(17),u=a(488);function o(e){var i=e.verifier,a=e.actionType,n=e.boundInfo,o=e.isLogged,m=(0,u.Tr)().t,s=l.Form.useFormInstance(),c=l.Form.useWatch("uuid",s),d=!!(null==n?void 0:n.publicInfo);return t().createElement(t().Fragment,null,t().createElement(l.Form.Item,{name:"uuid",label:m("Email"),rules:[{required:!0,message:m("Please fill in your email address")},{type:"email",message:m("Not a valid email address, please re-enter")}],initialValue:null==n?void 0:n.publicInfo},t().createElement(l.Input,{disabled:d})),t().createElement(l.Form.Item,{name:"code",label:m("Verification code"),rules:[{required:!0,message:m("Please enter the verification code")}]},t().createElement(r.n,{actionType:a,verifier:i,email:c,isLogged:o})))}i.default=o}}]);