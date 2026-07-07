import { Plugin } from '@nocobase/client-v2';
export declare function setTableColumnResizeEnabled(enabled: boolean): void;
export declare class PluginSystemEnhancementClientV2 extends Plugin<any> {
    load(): Promise<void>;
    patchTableColumnModel(TableColumnModel: any): void;
    patchSubTableColumnModel(): Promise<void>;
}
export default PluginSystemEnhancementClientV2;
