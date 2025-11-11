import {ComponentType} from "react";
import * as icons from "react-icons/md";

export type GmailItem = {
    id: string;
    name: string;
    icon: ComponentType;
    unread?: number;
    moreInfo?: string[];
    readOnly: boolean;
    children?: GmailItem[];
};

export const gmailData: GmailItem[] = [
    {
        id: "1",
        name: "天龙八部（卷I）",
        unread: 0,
        moreInfo: ["连载中", "[全 3/50 回]"],
        readOnly: false,
        icon: icons.MdInbox,
        children: [
            {
                id: "1-1",
                name: "正文",
                unread: 0,
                readOnly: false,
                icon: icons.MdInbox,
                children: [
                    {
                        id: "1-1-1",
                        name: "第一回 青衫磊落險峰行",
                        unread: 0,
                        readOnly: false,
                        icon: icons.MdInbox,
                    },
                    {
                        id: "1-1-2",
                        name: "第二回 玉璧月華明",
                        readOnly: false,
                        icon: icons.MdInbox,
                    },
                    {
                        id: "1-1-3",
                        name: "第三回 馬疾香幽",
                        readOnly: false,
                        icon: icons.MdInbox,
                    },
                ]
            },
            {
                id: "1-2",
                name: "人物图谱",
                unread: 54,
                readOnly: false,
                icon: icons.MdPeopleOutline,
            },
            {
                id: "1-3",
                name: "世界观",
                unread: 0,
                readOnly: false,
                icon: icons.MdOutlinePlace,
                children: [
                    {
                        id: "1-3-1",
                        name: "时空",
                        moreInfo: ["架空北宋"],
                        readOnly: false,
                        icon: icons.MdTimer,
                        children: [
                            {
                                id: "1-3-1-1",
                                name: "北宋",
                                moreInfo: ["仁宗"],
                                readOnly: false,
                                icon: icons.MdPersonPinCircle,
                            },
                            {
                                id: "1-3-1-2",
                                name: "大辽",
                                moreInfo: ["耶律洪基"],
                                readOnly: false,
                                icon: icons.MdPersonPinCircle,
                            },
                        ]
                    },
                    {
                        id: "1-3-2",
                        name: "门派",
                        readOnly: false,
                        icon: icons.MdNaturePeople,
                        children: [
                            {
                                id: "1-3-2-1",
                                name: "丐帮",
                                readOnly: false,
                                icon: icons.MdPerson,
                            },
                            {
                                id: "1-3-2-2",
                                name: "大理",
                                readOnly: false,
                                icon: icons.MdPerson,
                            },
                        ]
                    },
                    {
                        id: "1-3-3",
                        name: "武学",
                        readOnly: false,
                        icon: icons.MdLabelImportantOutline,
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
            },
        ]
    },
    {
        id: "2",
        name: "倚天屠龙记",
        moreInfo: ["已完结[全 4/4 回]"],
        readOnly: false,
        icon: icons.MdInbox,
        children: [
            {
                id: "2-1",
                name: "第01回：天涯思君不可忘",
                readOnly: false,
                icon: icons.MdInbox,
            },
            {
                id: "2-2",
                name: "第02回：武当山顶松柏长",
                readOnly: false,
                icon: icons.MdInbox,
            },
            {
                id: "2-3",
                name: "第03回：宝刀百炼生玄光	",
                readOnly: false,
                icon: icons.MdInbox,
            },
            {
                id: "2-4",
                name: "第04回：字作丧乱意彷徨",
                readOnly: false,
                icon: icons.MdInbox,
            },
        ]
    },
    {
        id: "3",
        name: "收藏",
        unread: 0,
        readOnly: false,
        icon: icons.MdStarOutline,
    },
    {
        id: "4",
        name: "写作计划",
        unread: 0,
        readOnly: false,
        icon: icons.MdAccessTime,
    },
    {
        id: "5",
        name: "灵感",
        unread: 0,
        readOnly: false,
        icon: icons.MdSend,
    },
    {
        id: "6",
        name: "草稿",
        unread: 14,
        readOnly: false,
        icon: icons.MdOutlineDrafts,
    },
    {
        id: "7",
        name: "垃圾篓",
        unread: 11,
        readOnly: false,
        icon: icons.MdOutlineDelete,
        children: [
            {
                id: "12",
                name: "Categories",
                icon: icons.MdOutlineLabel,
                readOnly: false,
                children: [
                    {
                        id: "13",
                        name: "Social",
                        unread: 946,
                        readOnly: false,
                        icon: icons.MdPeopleOutline,
                    },
                    {
                        id: "14",
                        name: "Updates",
                        unread: 4580,
                        readOnly: false,
                        icon: icons.MdOutlineInfo,
                    },
                    {
                        id: "15",
                        name: "Forums",
                        unread: 312,
                        readOnly: false,
                        icon: icons.MdChatBubbleOutline,
                        children: [
                            {
                                id: "15-1",
                                name: "Github",
                                readOnly: false,
                                icon: icons.MdSocialDistance,
                            },
                        ],
                    },
                    {
                        id: "16",
                        name: "Promotions",
                        unread: 312,
                        readOnly: false,
                        icon: icons.MdOutlineLocalOffer,
                    },
                ],
            },
        ]
    },

];