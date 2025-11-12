import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { path } from "@tauri-apps/api";
import { GmailItem, workspaceDir } from "@components/model";
import * as icons from "react-icons/md";
import { BsTree } from "react-icons/bs";


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
 * 从配置文件加载数据并转换为GmailItem[]
 * @param configPath 配置文件所在的目录路径
 * @returns Promise<GmailItem[]> 加载的数据数组
 */
export const loadDataFromConfig = async (configPath: string): Promise<GmailItem[]> => {
    try {
        // 使用提供的路径构建配置文件的绝对路径
        const configFilePath = await path.join(configPath, "mano.conf.json");
        
        // 读取JSON文件内容
        const jsonString = await readTextFile(configFilePath);
        
        // 解析JSON
        const config = JSON.parse(jsonString);
        
        // 获取可用的图标组件列表
        const availableIcons = Object.values(icons);
        const defaultIcon = BsTree;
        
        // 递归函数，为每个项目添加随机icon
        const addIconsToItems = (items: any[]): GmailItem[] => {
            return items.map(item => {
                // 随机选择一个图标组件，如果可用的图标数组为空则使用默认图标
                const randomIcon = availableIcons.length > 0 
                    ? availableIcons[Math.floor(Math.random() * availableIcons.length)] 
                    : defaultIcon;
                
                const gmailItem: GmailItem = {
                    id: item.id,
                    name: item.name,
                    icon: randomIcon,
                    unread: item.unread,
                    moreInfo: item.moreInfo,
                    readOnly: item.readOnly,
                    nodeType: item.nodeType,
                    children: item.children ? addIconsToItems(item.children) : undefined
                };
                
                return gmailItem;
            });
        };
        
        // 处理数据并返回
        const dataWithIcons = addIconsToItems(config.treeData);
        console.log("Data successfully loaded from mano.conf.json");
        return dataWithIcons;
    } catch (error) {
        console.error("Error loading data from config file:", error);
        // 如果加载失败，返回空数组
        return [];
    }
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