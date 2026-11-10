# 开发交接

## 运行结构

`index.html` 加载 `src/main.js`，默认使用大厅模式。页面逻辑在浏览器执行，`tools/server.mjs` 仅提供静态文件；没有后端接口、账号系统或服务器状态。

游戏画布固定为 400×580，外层随屏幕等比例缩放。物理以 200 Hz 固定步长推进，渲染使用 `requestAnimationFrame`。

| 文件 | 职责 |
| --- | --- |
| `src/main.js` | 加载、输入、场景切换、主循环、奖励与 UI 协调 |
| `src/demo-room.js` | 房间容量、玩家状态、最高纪录、解锁、购买和持久化 |
| `src/room-lobby-world.js` | 大厅驾驶、镜头、五个实体入口、锁与车顶昵称 |
| `src/room-ui.js` / `.css` | 升级、金币、排行榜、设置、摇杆和精简进度栏 |
| `src/room-world.js` | 同场车辆和纪录旗帜 |
| `src/room-vehicles.js` | 七车型的外观阶段、轮胎、颜色视图缓存 |
| `src/room-progression.js` | 大厅金币、升级价格/上限、奖励、玩家车型与颜色 |
| `src/room-items.js` | 辣椒/滑翔翼的一次使用规则 |
| `src/physics.js` / `src/progression.js` | 发射、惯性、重力、阻力与车辆属性 |
| `src/ground-contact.js` / `src/mesh-contact.js` | 地面足迹与网格接触 |
| `src/scene-collisions.js` | 静态、旋转场景物体的碰撞 |
| `src/renderer.js` / `src/native-*.js` | WebGL、地形/材质、光照、阴影、UI 与配置数据 |
| `src/save.js` / `src/campaign.js` | 独立单人模式的存档、购买和战役流程 |

## 资源

`public/assets/manifest.json` 是车型、关卡、音频和物件入口。地图由场景 GLB、地形网格、碰撞数据和材质配置共同构成；不能只替换一个模型文件而忽略相关引用。

`assets/room/previews` 为大厅使用的赛道预览，`assets/room/replays` 为 AI 轨迹。回放必须与地图、车辆参数和道具规则一致；改变相关数据后需要更新回放并检查碰撞表现。

`native*`、`source*`、`file/pathId` 等内部标识参与现有几何/材质绑定或存档兼容。不要仅为命名统一而删除或改写它们。运行素材来源和许可说明集中在根目录 `NOTICE.md`。

## 状态与存档

- 大厅进度和单人模式分别存储，继续使用既有键名以兼容已经保存的浏览器进度。
- 只有本人成功抵达当前地图终点才解锁下一图；AI 成绩、退出与失败不会解锁。
- 自然结束奖励只发一次；主动返回大厅视为放弃，本次不给金币。
- 排行榜只是当前本地房间的数据视图，切换排行页不会替代实体弹弓选图。

## 后续接入多人服务

优先替换 `DemoRoom` 的玩家/纪录输入和 `RoomWorld` 的远端姿态数据，保留 UI 所使用的 snapshot 结构。服务器需要负责真实身份、房间上限、加入退出、位置同步、成绩校验、奖励与升级持久化。当前 localStorage 金币、解锁和成绩仅适用于演示，不可当作可信服务器数据。

当前车辆没有车对车网络碰撞；AI 是固定回放，使用满级配置。地面驾驶、接触和空气运动包含街机近似。动态障碍的时钟与回放可能存在相位差。

## 改动后的检查

先运行 `npm test`；UI、模型或资源改动还需要浏览器检查。详细步骤见 `TESTING.md`。生成报告、日志、浏览器配置和本地密钥不提交。
