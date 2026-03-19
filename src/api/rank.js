import { request } from './client.js'
import { USE_MOCK } from '../config.js'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- Mock 数据（与文档中的响应格式一致）--------------
const MOCK_MAIN_VIDEO = [
  { id: 1, title: '【精选】年度最佳创意短片合集，带你领略视觉艺术的边界与可能。', views: '128万' },
  { id: 2, title: '深度解析：从零到一的品牌设计思维，设计师必看的实战案例分享。', views: '96万' },
  { id: 3, title: '前端架构演进之路：Vue 3 + Vite 构建高性能应用的完整实践。', views: '84万' },
  { id: 4, title: '创意摄影技巧：手机也能拍出电影感大片。', views: '72万' },
  { id: 5, title: '动画制作入门：After Effects 从零到出片。', views: '65万' },
  { id: 6, title: '品牌视觉设计：Logo 与 VI 系统完整指南。', views: '58万' },
  { id: 7, title: '短视频脚本写作：爆款内容的底层逻辑。', views: '52万' },
  { id: 8, title: '3D 建模入门：Blender 零基础到独立创作。', views: '46万' },
  { id: 9, title: '插画风格探索：从扁平到赛博朋克的视觉语言。', views: '41万' },
  { id: 10, title: '动态海报设计：Motion Graphics 实战教程。', views: '38万' },
]

const MOCK_MAIN_WEIBO = [
  { id: 1, title: 'AI 绘画入门：Stable Diffusion 从零到精通的完整指南。', viewsNum: '923847', tag: '热' },
  { id: 2, title: 'ChatGPT 实战：提升工作效率的 50 个提示词技巧。', viewsNum: '785621', tag: '新' },
  { id: 3, title: 'Web3 与元宇宙：区块链技术应用入门解析。', viewsNum: '652341', tag: '' },
  { id: 4, title: 'Midjourney 提示词大全：从入门到出图。', viewsNum: '445237', tag: '新' },
  { id: 5, title: 'Notion AI 工作流：打造个人知识库。', viewsNum: '382186', tag: '' },
  { id: 6, title: 'Python 数据分析实战：Pandas 与可视化入门。', viewsNum: '356421', tag: '' },
  { id: 7, title: 'Figma 设计入门：从零开始做 UI 设计。', viewsNum: '298734', tag: '新' },
  { id: 8, title: 'Docker 容器化部署：从入门到生产环境。', viewsNum: '245891', tag: '' },
  { id: 9, title: 'TypeScript 进阶：类型系统与工程化实践。', viewsNum: '198562', tag: '' },
  { id: 10, title: 'Rust 编程入门：系统级语言从零到精通。', viewsNum: '156234', tag: '' },
]

const MOCK_SUB_VIDEO = [
  { id: 1, title: '音乐制作入门：如何在 30 天内掌握基础混音与编曲技巧。', views: '72万' },
  { id: 2, title: '摄影后期调色教程：打造电影感画面的 Lightroom 预设分享。', views: '58万' },
  { id: 3, title: '产品经理的日常：从需求分析到原型设计的完整工作流。', views: '45万' },
  { id: 4, title: 'Excel 进阶：数据透视表与 Power Query 实战。', views: '42万' },
  { id: 5, title: 'PPT 设计进阶：从模板到原创的视觉表达。', views: '38万' },
  { id: 6, title: '写作技巧提升：从零开始写出爆款文章。', views: '35万' },
  { id: 7, title: '英语口语速成：职场沟通必备表达。', views: '32万' },
  { id: 8, title: '项目管理入门：敏捷开发与 Scrum 实践。', views: '28万' },
  { id: 9, title: '逻辑思维训练：结构化表达与批判性思考。', views: '25万' },
  { id: 10, title: '时间管理法则：GTD 与番茄工作法实战。', views: '22万' },
]

const MOCK_SUB_WEIBO = [
  { id: 1, title: '生活 Vlog 剪辑：手机剪映从入门到出片的完整流程。', viewsNum: '882104', tag: '热' },
  { id: 2, title: '健身跟练：30 天腹肌养成计划，科学燃脂塑形。', viewsNum: '761892', tag: '新' },
  { id: 3, title: '美食探店：城市隐藏宝藏餐厅大揭秘。', viewsNum: '623456', tag: '' },
  { id: 4, title: '旅行攻略：周末短途游的 10 个宝藏目的地。', viewsNum: '512034', tag: '新' },
  { id: 5, title: '居家收纳：小户型空间利用技巧分享。', viewsNum: '408721', tag: '' },
  { id: 6, title: '宠物养护指南：猫咪与狗狗的日常护理。', viewsNum: '365234', tag: '' },
  { id: 7, title: '咖啡入门：从手冲到拉花的完整指南。', viewsNum: '312567', tag: '新' },
  { id: 8, title: '植物养护：室内绿植从养活到养好。', viewsNum: '268901', tag: '' },
  { id: 9, title: '手工 DIY：低成本改造出租屋。', viewsNum: '225634', tag: '' },
  { id: 10, title: '极简生活：断舍离与 minimalist 生活方式。', viewsNum: '198456', tag: '' },
]

async function mockGet(path) {
  await delay(300)
  if (path === '/api/ranks/main/video') return { ok: true, data: { list: [...MOCK_MAIN_VIDEO] } }
  if (path === '/api/ranks/main/weibo') return { ok: true, data: { list: [...MOCK_MAIN_WEIBO] } }
  if (path === '/api/ranks/sub/video') return { ok: true, data: { list: [...MOCK_SUB_VIDEO] } }
  if (path === '/api/ranks/sub/weibo') return { ok: true, data: { list: [...MOCK_SUB_WEIBO] } }
  return { ok: false, data: null }
}

/**
 * 获取排行榜 - 视频榜
 * @param {'main'|'sub'} board - main=频道排行榜(创意精选/技能提升)，sub=副频道排行榜
 * @returns {Promise<{ list: Array<{ id: number, title: string, views: string }> }>}
 */
export async function getRankVideo(board) {
  const path = `/api/ranks/${board}/video`
  if (USE_MOCK) {
    const res = await mockGet(path)
    return res.data?.list ? { list: res.data.list } : Promise.reject(new Error('mock 数据异常'))
  }
  const { ok, data } = await request(path)
  if (!ok || !data?.list) throw new Error(data?.message || '获取榜单失败')
  return data
}

/**
 * 获取排行榜 - 微博/话题榜
 * @param {'main'|'sub'} board - main=本周新榜，sub=热门推荐
 * @returns {Promise<{ list: Array<{ id: number, title: string, viewsNum: string, tag: string }> }>}
 */
export async function getRankWeibo(board) {
  const path = `/api/ranks/${board}/weibo`
  if (USE_MOCK) {
    const res = await mockGet(path)
    return res.data?.list ? { list: res.data.list } : Promise.reject(new Error('mock 数据异常'))
  }
  const { ok, data } = await request(path)
  if (!ok || !data?.list) throw new Error(data?.message || '获取榜单失败')
  return data
}
