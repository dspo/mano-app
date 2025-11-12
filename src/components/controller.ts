import { writeTextFile } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { GmailItem, workspaceDir } from "@components/model";


/**
 * 过滤函数，移除不能序列化的字段（如icon组件）
 * @param items 需要过滤的数据项数组
 * @returns 过滤后的数据项数组
 */
export const filterDataForSerialization = (items: readonly GmailItem[]): any[] => {
    return items.map(item => {
        // 创建新对象，移除icon字段
        const filteredItem: Record<string, any> = {
            id: item.id,
            name: item.name,
            unread: item.unread,
            moreInfo: item.moreInfo,
            readOnly: item.readOnly,
            nodeType: item.nodeType,
            // 递归处理children
            children: item.children ? filterDataForSerialization(item.children) : undefined
        };

        // 移除undefined值
        Object.keys(filteredItem).forEach(key => {
            if (filteredItem[key] === undefined) {
                delete filteredItem[key];
            }
        });

        return filteredItem;
    });
};

/**
 * 将数据保存到配置文件
 * @param data 原始数据
 * @returns Promise<void>
 */
export const saveDataToConfig = async (data: readonly GmailItem[]): Promise<void> => {
    try {
        // 过滤数据，移除不能序列化的字段
        const filteredData = filterDataForSerialization(data);

        // 创建配置对象
        const config = {
            treeData: filteredData,
            lastUpdated: new Date().toISOString()
        };

        // 转换为JSON字符串
        const jsonString = JSON.stringify(config, null, 2);

        // 使用绝对路径写入文件到workspaceDir目录
        const configFilePath = await path.join(workspaceDir, "mano.conf.json");
        await writeTextFile(configFilePath, jsonString);

        console.log("Data successfully saved to mano.conf.json");
    } catch (error) {
        console.error("Error saving data to config file:", error);
    }
};