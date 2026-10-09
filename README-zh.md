# Threadloom

Threadloom 是一个可移植的 agent 协作插件：整合会话回溯、发布清理、tmux/cmux 交接、圆桌决策、leader 分发、限流降级和按项目隔离的共享记忆。

技能协议放在 `skills/`，可被 Claude Code、Codex 和 Agent Skills 生态读取；`bin/threadloom.mjs` 提供实际执行器。记忆默认按 canonical Git root 隔离，同一仓库的 worktree 共享项目记忆；无 Git 目录按真实路径隔离。

```bash
./install.sh
threadloom memory init
threadloom doctor --json
```

provider 和终端均为可选依赖。没有 Claude/Codex/Kimi、cmux 或 tmux 时，记忆与文件交接仍可用。
