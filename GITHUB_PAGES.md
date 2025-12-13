# GitHub Pages 部署指南

## 如何将 FIRE 计算器发布为公网可访问的页面

GitHub Pages 是 GitHub 提供的免费静态网站托管服务，可以让你的 HTML 页面公网访问。

### 步骤 1: 启用 GitHub Pages

1. 访问你的仓库：https://github.com/when007/fire
2. 点击仓库页面右上角的 **Settings**（设置）
3. 在左侧菜单中找到 **Pages**（页面）
4. 在 **Source**（源）部分：
   - 选择 **Deploy from a branch**（从分支部署）
   - 在 **Branch**（分支）下拉菜单中选择 **main**
   - 在 **Folder**（文件夹）中选择 **/ (root)**（根目录）
5. 点击 **Save**（保存）

### 步骤 2: 等待部署完成

- GitHub 会在几分钟内自动构建和部署你的页面
- 部署完成后，你会看到一条绿色提示信息，显示你的网站地址

### 步骤 3: 访问你的网站

你的网站地址格式为：
```
https://when007.github.io/fire/
```

**注意：** 如果是私有仓库，GitHub Pages 默认只对仓库所有者可见。如果需要公开访问，需要将仓库设置为公开（Public）。

### 步骤 4: 更新内容

每次你向 `main` 分支推送代码后，GitHub Pages 会自动重新部署，通常几分钟内就能看到更新。

### 私有仓库的 GitHub Pages

如果你的仓库是私有的：
- **免费账户**：GitHub Pages 只能被仓库所有者访问（需要登录 GitHub）
- **Pro 账户**：可以选择公开访问 GitHub Pages，即使仓库是私有的

### 常见问题

**Q: 为什么我的页面显示 404？**
A: 请确保：
- 仓库中确实有 `index.html` 文件
- GitHub Pages 已正确配置为从 `main` 分支的根目录部署
- 等待几分钟让 GitHub 完成首次部署

**Q: 如何查看部署状态？**
A: 在仓库页面点击 **Actions**（操作）标签，可以看到部署历史记录。

**Q: 如何自定义域名？**
A: 在 GitHub Pages 设置中可以配置自定义域名，需要：
1. 在域名服务商处配置 CNAME 记录
2. 在仓库根目录创建 `CNAME` 文件，内容为你的域名

