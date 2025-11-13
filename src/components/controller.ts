import {readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {Directory, GmailItem, Markdown, PlainText, RichText} from "@components/model";
import * as icons from "react-icons/md";
import {BsTree} from "react-icons/bs";


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
 * @param filename 配置文件所在的目录路径
 * @returns Promise<GmailItem[]> 加载的数据数组
 */
export const loadDataFromConfig = async (filename: string): Promise<GmailItem[]> => {
    try {
        const config = await readTextFile(filename).then((data: any) => {
            const config: { data: GmailItem[] } = JSON.parse(data);
            return config.data;
        });

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
        const dataWithIcons = addIconsToItems(config);
        console.log("Data successfully loaded from mano.conf.json");
        return dataWithIcons;
    } catch (error) {
        console.error("Error loading data from config file:", filename, error);
        // 如果加载失败，返回空数组
        return [];
    }
};

/**
 * 将数据保存到配置文件
 * @param filename
 * @param data 原始数据
 * @returns Promise<void>
 */
export const saveDataToConfig = async (filename: string, data: readonly GmailItem[]): Promise<void> => {
    // 过滤数据，移除不能序列化的字段
    let filteredData: any[];
    try {
        filteredData = filterDataForSerialization(data);
        console.log("Data filtered for serialization successfully");
    } catch (error) {
        console.error("Error filtering data for serialization:", error);
        return;
    }

    // 创建配置对象
    let config: any;
    try {
        config = {
            data: filteredData,
            lastUpdated: new Date().toISOString()
        };
        console.log("Config object created successfully");
    } catch (error) {
        console.error("Error creating config object:", error);
        return;
    }

    // 转换为JSON字符串
    let content: string;
    try {
        content = JSON.stringify(config, null, 2);
        console.log("Config converted to JSON string successfully");
    } catch (error) {
        console.error("Error converting config to JSON string:", error);
        return;
    }

    return writeTextFile(filename, content)
        .catch(error => console.log("failed to writeTextFile", filename, error))
        .then(() => console.log("writeTextFile is done"));
};

export const getDefaultItmes = (): GmailItem[] => {
    return defaultItems;
};

const defaultItems: GmailItem[] = [
    {
        id: "1",
        name: "天龙八部",
        unread: 0,
        moreInfo: ["连载中", "[全 3/50 回]"],
        readOnly: false,
        icon: icons.MdInbox,
        nodeType: Directory,
        children: [
            {
                id: "1-1",
                name: "卷 I",
                unread: 0,
                readOnly: false,
                icon: icons.MdInbox,
                nodeType: Directory,
                children: [
                    {
                        id: "1-1-1",
                        name: "第一回 青衫磊落險峰行",
                        unread: 0,
                        readOnly: false,
                        icon: icons.MdInbox,
                        nodeType: PlainText,
                    },
                    {
                        id: "1-1-2",
                        name: "第二回 玉璧月華明",
                        readOnly: false,
                        icon: icons.MdInbox,
                        nodeType: PlainText,
                    },
                    {
                        id: "1-1-3",
                        name: "第三回 馬疾香幽",
                        readOnly: false,
                        icon: icons.MdInbox,
                        nodeType: PlainText,
                    },
                ]
            },
            {
                id: "1-2",
                name: "人物图谱",
                unread: 54,
                readOnly: false,
                icon: icons.MdPeopleOutline,
                nodeType: PlainText,
            },
            {
                id: "1-3",
                name: "世界观",
                unread: 0,
                readOnly: false,
                icon: icons.MdOutlinePlace,
                nodeType: Directory,
                children: [
                    {
                        id: "1-3-1",
                        name: "时空",
                        moreInfo: ["架空北宋"],
                        readOnly: false,
                        icon: icons.MdTimer,
                        nodeType: Directory,
                        children: [
                            {
                                id: "1-3-1-1",
                                name: "北宋",
                                moreInfo: ["仁宗"],
                                readOnly: false,
                                icon: icons.MdPersonPinCircle,
                                nodeType: RichText,
                            },
                            {
                                id: "1-3-1-2",
                                name: "大辽",
                                moreInfo: ["耶律洪基"],
                                readOnly: false,
                                icon: icons.MdPersonPinCircle,
                                nodeType: RichText,
                            },
                        ]
                    },
                    {
                        id: "1-3-2",
                        name: "门派",
                        readOnly: false,
                        icon: icons.MdNaturePeople,
                        nodeType: Directory,
                        children: [
                            {
                                id: "1-3-2-1",
                                name: "丐帮",
                                readOnly: false,
                                icon: icons.MdPerson,
                                nodeType: RichText,
                            },
                            {
                                id: "1-3-2-2",
                                name: "大理",
                                readOnly: false,
                                icon: icons.MdPerson,
                                nodeType: RichText,
                            },
                        ]
                    },
                    {
                        id: "1-3-3",
                        name: "武学",
                        readOnly: false,
                        icon: icons.MdLabelImportantOutline,
                        nodeType: Directory,
                        children: []
                    },
                ]
            },
            {
                id: "1-4",
                name: "伏笔",
                moreInfo: ["[12/18]"],
                readOnly: false,
                icon: icons.MdStraighten,
                nodeType: PlainText,
            },
        ]
    },
    {
        id: "2",
        name: "倚天屠龙记",
        moreInfo: ["已完结[全 4/4 回]"],
        readOnly: false,
        icon: icons.MdInbox,
        nodeType: Directory,
        children: [
            {
                id: "2-1",
                name: "第01回：天涯思君不可忘",
                readOnly: false,
                icon: icons.MdInbox,
                nodeType: PlainText,
            },
            {
                id: "2-2",
                name: "第02回：武当山顶松柏长",
                readOnly: false,
                icon: icons.MdInbox,
                nodeType: PlainText,
            },
            {
                id: "2-3",
                name: "第03回：宝刀百炼生玄光\t",
                readOnly: false,
                icon: icons.MdInbox,
                nodeType: PlainText,
            },
            {
                id: "2-4",
                name: "第04回：字作丧乱意彷徨",
                readOnly: false,
                icon: icons.MdInbox,
                nodeType: PlainText,
            },
        ]
    },
    {
        id: "3",
        name: "收藏",
        unread: 0,
        readOnly: false,
        icon: icons.MdStarOutline,
        nodeType: Directory,
    },
    {
        id: "4",
        name: "写作计划",
        unread: 0,
        readOnly: false,
        icon: icons.MdAccessTime,
        nodeType: PlainText,
    },
    {
        id: "5",
        name: "灵感",
        unread: 0,
        readOnly: false,
        icon: icons.MdSend,
        nodeType: Markdown,
    },
    {
        id: "6",
        name: "草稿",
        unread: 14,
        readOnly: false,
        icon: icons.MdOutlineDrafts,
        nodeType: Directory,
    },
    {
        id: "7",
        name: "垃圾篓",
        unread: 11,
        readOnly: false,
        icon: icons.MdOutlineDelete,
        nodeType: Directory,
        children: [
            {
                id: "12",
                name: "Categories",
                icon: icons.MdOutlineLabel,
                readOnly: false,
                nodeType: Directory,
                children: [
                    {
                        id: "13",
                        name: "Social",
                        unread: 946,
                        readOnly: false,
                        icon: icons.MdPeopleOutline,
                        nodeType: Directory,
                    },
                    {
                        id: "14",
                        name: "Updates",
                        unread: 4580,
                        readOnly: false,
                        icon: icons.MdOutlineInfo,
                        nodeType: Directory,
                    },
                    {
                        id: "15",
                        name: "Forums",
                        unread: 312,
                        readOnly: false,
                        icon: icons.MdChatBubbleOutline,
                        nodeType: Directory,
                        children: [
                            {
                                id: "15-1",
                                name: "Github",
                                readOnly: false,
                                icon: icons.MdSocialDistance,
                                nodeType: Directory,
                            },
                        ],
                    },
                    {
                        id: "16",
                        name: "Promotions",
                        unread: 312,
                        readOnly: false,
                        icon: icons.MdOutlineLocalOffer,
                        nodeType: Directory,
                    },
                ],
            },
        ]
    },
];