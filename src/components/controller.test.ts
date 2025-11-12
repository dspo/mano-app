import { loadDataFromConfig } from './controller';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { path } from '@tauri-apps/api';
import * as icons from 'react-icons/md';

// Mock all dependencies
jest.mock('@tauri-apps/plugin-fs', () => ({
    readTextFile: jest.fn()
}));

jest.mock('@tauri-apps/api', () => ({
    path: {
        join: jest.fn()
    }
}));

jest.mock('react-icons/md', () => ({
    MdInbox: jest.fn(() => 'MockedMdInbox'),
    MdStar: jest.fn(() => 'MockedMdStar'),
    MdSend: jest.fn(() => 'MockedMdSend')
}));

jest.mock('react-icons/bs', () => ({
    BsTree: jest.fn(() => 'MockedBsTree')
}));

describe('loadDataFromConfig', () => {
    const mockReadTextFile = readTextFile as jest.MockedFunction<typeof readTextFile>;
    const mockPathJoin = path.join as jest.MockedFunction<typeof path.join>;

    beforeEach(() => {
        jest.clearAllMocks();

        // 模拟路径连接函数
        mockPathJoin.mockImplementation(async (basePath: string, fileName: string) => {
            return `${basePath}/${fileName}`;
        });
    });

    it('应该成功加载并转换数据', async () => {
        // 模拟配置文件内容
        const mockConfig = {
            treeData: [
                {
                    id: '1',
                    name: '收件箱',
                    unread: 5,
                    nodeType: 'RichText',
                    children: [
                        {
                            id: '1-1',
                            name: '测试邮件',
                            unread: true,
                            nodeType: 'RichText'
                        }
                    ]
                },
                {
                    id: '2',
                    name: '已发送',
                    unread: 0,
                    nodeType: 'Directory'
                }
            ]
        };

        mockReadTextFile.mockResolvedValue(JSON.stringify(mockConfig));

        // 执行测试
        const result = await loadDataFromConfig('/test/path');

        // 验证结果
        expect(mockPathJoin).toHaveBeenCalledWith('/test/path', 'mano.conf.json');
        expect(mockReadTextFile).toHaveBeenCalledWith('/test/path/mano.conf.json');

        // 验证返回的数据结构
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveProperty('id', '1');
        expect(result[0]).toHaveProperty('name', '收件箱');
        expect(result[0]).toHaveProperty('unread', 5);
        expect(result[0]).toHaveProperty('nodeType', 'RichText');
        expect(result[0]).toHaveProperty('icon'); // 验证添加了icon

        // 验证子节点
        expect(result[0].children).toHaveLength(1);
        expect(result[0].children?.[0]).toHaveProperty('id', '1-1');
        expect(result[0].children?.[0]).toHaveProperty('icon');

        // 验证第二个节点
        expect(result[1]).toHaveProperty('id', '2');
        expect(result[1]).toHaveProperty('name', '已发送');
        expect(result[1]).toHaveProperty('icon');
    });

    it('当文件不存在时应该返回空数组', async () => {
        // 模拟文件读取失败
        mockReadTextFile.mockRejectedValue(new Error('File not found'));

        const result = await loadDataFromConfig('/test/path');

        expect(result).toEqual([]);
    });

    it('当JSON格式错误时应该返回空数组', async () => {
        // 模拟无效的JSON
        mockReadTextFile.mockResolvedValue('invalid json');

        const result = await loadDataFromConfig('/test/path');

        expect(result).toEqual([]);
    });

    it('当没有可用图标时应该使用默认图标', async () => {
        // 保存原始的icons值
        const originalIcons = { ...icons };

        try {
            // 模拟空的图标对象
            Object.keys(icons).forEach(key => {
                delete (icons as any)[key];
            });

            const mockConfig = {
                treeData: [
                    {
                        id: '1',
                        name: '测试',
                        nodeType: 'RichText'
                    }
                ]
            };

            mockReadTextFile.mockResolvedValue(JSON.stringify(mockConfig));

            const result = await loadDataFromConfig('/test/path');

            expect(result[0]).toHaveProperty('icon');
        } finally {
            // 恢复原始的icons值
            Object.assign(icons, originalIcons);
        }
    });
});