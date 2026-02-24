/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  useSchemaInitializer,
  DataBlockInitializer,
  createTableBlockUISchema,
  useSchemaInitializerItem,
} from '@nocobase/client';
import { TableOutlined } from '@ant-design/icons';

export const EnhancedTableBlockInitializer = (props: any) => {
  const { insert } = useSchemaInitializer();
  const itemConfig = useSchemaInitializerItem();

  return (
    <DataBlockInitializer
      {...itemConfig} // Replace props with itemConfig to fix missing title
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async (options: any) => {
        const schema = createTableBlockUISchema({
          collectionName: options.item.name,
          dataSource: options.item.dataSource,
        });

        // Find the TableV2 wrapper and add the decorator and summaryConfig prop
        if (schema.properties) {
          const tableNodeKey = Object.keys(schema.properties).find(
            (k) => schema.properties![k]['x-component'] === 'TableV2',
          );
          if (tableNodeKey) {
            schema.properties[tableNodeKey]['x-decorator'] = 'EnhancedTableV1Wrapper';
            schema.properties[tableNodeKey]['x-decorator-props'] =
              schema.properties[tableNodeKey]['x-decorator-props'] || {};
            schema.properties[tableNodeKey]['x-decorator-props'].summaryConfig = {};
          }
        }

        insert(schema);
      }}
    />
  );
};
