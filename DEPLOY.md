# AgriJump — 部署到 Vercel（小白版）

部署完你会得到一个**固定网址**，手机、电脑、发给朋友都能打开，再也不用管 IP 变不变。

---

## 第 0 步：确认 npm 能用

打开「终端」(Terminal)，粘贴：

```bash
node -v && npm -v
```

正常会显示 `v22.22.2` 和 `10.9.7`。

> 如果显示 `command not found`，先关掉终端窗口，**重新开一个**再试。
> 还不行就粘贴 `source ~/.zshrc` 回车，再试一次。

---

## 第 1 步：进入项目文件夹

```bash
cd "/Users/kirensmmm/WorkBuddy AI/2026-09-26-23-07-14/agrijump"
```

---

## 第 2 步：登录 Vercel（只需做一次）

```bash
npx vercel login
```

- 第一次跑会问 `Need to install the following packages... Ok to proceed?` → 输入 `y` 回车
- 然后问你用哪种方式登录，**用方向键选**，推荐选 `Continue with GitHub`（或 `Continue with Email`）
- 会自动打开浏览器 → 点确认登录 → 回到终端看到 `Success!`

> 没有 Vercel 账号的话，登录页上可以直接注册（用邮箱或 GitHub 都行，免费）。

---

## 第 3 步：部署

```bash
npx vercel --prod
```

会连续问你几个问题，**照下面这样回答**（直接按回车就是用括号里的默认值）：

| 终端问什么 | 你输入 |
|---|---|
| `Set up and deploy?` | `y` 回车 |
| `Which scope...?` | 直接回车（选你自己的账号） |
| `Link to existing project?` | `n` 回车 |
| `What's your project's name?` | `agrijump` 回车 |
| `In which directory is your code located?` | 直接回车（默认 `./`） |
| `Want to modify these settings?` | `n` 回车 |

然后它会自己上传、安装依赖、编译。等 1～3 分钟，最后会打印：

```
✅  Production: https://agrijump-xxxx.vercel.app
```

**这个网址就是你的 App 了。** 手机浏览器打开 → 分享 → 添加到主屏幕，就跟原生 App 一样。

---

## 以后改了代码，怎么更新？

改完代码，只要再跑一次这一条就行（不用重新登录）：

```bash
cd "/Users/kirensmmm/WorkBuddy AI/2026-09-26-23-07-14/agrijump" && npx vercel --prod
```

---

## 常见问题

**Q：`npx vercel` 卡住不动？**
第一次要下载命令行工具（约 50MB），慢是正常的。等 1～2 分钟。公司/学校网络如果拦截，换成手机热点试试。

**Q：部署成功但打开是白屏？**
先看终端有没有红色的报错。也可以先本地验证一下能不能编译通过：

```bash
cd "/Users/kirensmmm/WorkBuddy AI/2026-09-26-23-07-14/agrijump" && npm run build
```

看到 `✓ Generating static pages (7/7)` 就说明代码没问题。

**Q：想换一个更好记的网址？**
部署完在 vercel.com 打开这个项目 → Settings → Domains → 可以加自定义域名（要自己买域名）。
免费的 `*.vercel.app` 地址在 Settings → Domains 里也能改前缀。

---

## 重要提醒：现在数据是本机存的

目前所有 drop 和你的个人资料都存在**浏览器的 localStorage** 里。
也就是说：

- ✅ 同一台手机、同一个浏览器里，关掉再打开数据还在
- ❌ **换一台手机 / 换个浏览器，看不到别人发的 drop**

所以部署完，你和朋友各自打开的是「同一个 App，但各自独立的空白地图」。

如果你想让**朋友们真的能互相看到对方发的 drop**（这才是这个 App 的本意），
需要给它接一个云端数据库。这个我可以帮你加，到时候说一声就行。
