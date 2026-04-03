<template>
  <div class="workshop" ref="workshopEl">
    <aside class="history-sidebar" :class="{ expanded: sidebarExpanded }">
      <div class="sidebar-top">
        <button type="button" class="sidebar-icon-btn" :title="sidebarExpanded ? '收起侧栏' : '展开侧栏'" @click="toggleSidebar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        <button type="button" class="sidebar-icon-btn" title="新建对话" @click="createNewConversation">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1">
            <path d="M12 5v14M5 12h14" />
            <path d="M19 3l2 2-9.5 9.5H9.5V12z" />
          </svg>
        </button>
      </div>

      <template v-if="sidebarExpanded">
        <div class="sidebar-brand">Workshop</div>

        <div class="sidebar-actions">
          <button type="button" class="sidebar-action-row" @click="createNewConversation">
            <span class="sidebar-action-icon">✎</span>
            <span>发起新对话</span>
          </button>
          <div class="sidebar-user-card">
            <div class="sidebar-user-label">当前用户</div>
            <div class="sidebar-user-name">{{ userDisplayName }}</div>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="sidebar-section-title">对话</div>
          <div class="sidebar-conversation-list">
            <div
              v-for="item in conversationList"
              :key="item.id"
              class="sidebar-conversation-item"
              :class="{ active: item.id === currentConversationId }"
            >
              <div class="sidebar-conversation-main">
                <template v-if="editingConversationId === item.id">
                  <input
                    :id="conversationInputId(item.id)"
                    v-model="editingTitle"
                    type="text"
                    class="sidebar-conversation-input"
                    maxlength="40"
                    @click.stop
                    @keydown.enter.prevent="commitRename(item.id)"
                    @keydown.esc.prevent="cancelRename"
                    @blur="commitRename(item.id)"
                  />
                </template>
                <button
                  v-else
                  type="button"
                  class="sidebar-conversation-switch"
                  @click="switchConversation(item.id)"
                >
                  <span class="sidebar-conversation-name">{{ item.title }}</span>
                  <span class="sidebar-conversation-time">{{ formatConversationTime(item.updatedAt) }}</span>
                </button>
              </div>
              <button
                type="button"
                class="sidebar-conversation-edit"
                title="修改对话名"
                @click="startRename(item.id)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
              <button
                v-if="conversationList.length > 1"
                type="button"
                class="sidebar-conversation-delete"
                title="删除对话"
                @click="deleteConversation(item.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-action-row sidebar-action-row--muted" @click="logout">
            <span class="sidebar-action-icon">⚙</span>
            <span>退出登录</span>
          </button>
        </div>
      </template>
    </aside>

    <div class="workspace-main">
    <!-- Left: Chat Panel -->
    <div class="chat-panel" :style="{ width: leftWidth + '%' }">
      <div class="chat-header">
        <div class="chat-header-main">
          <div>
            <div class="chat-title-row">
              <div class="chat-title">{{ chatTitle }}</div>
              <button type="button" class="title-edit-btn" title="修改对话名" @click="startRename(currentConversationId)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
            </div>
            <div class="chat-subtitle">当前用户：{{ userDisplayName }}</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" :title="sidebarExpanded ? '收起历史侧栏' : '展开历史侧栏'" @click="toggleSidebar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>
          <button class="icon-btn" title="新建对话" @click="createNewConversation">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button class="icon-btn" title="清空当前对话" @click="clearChat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>

      <div class="messages" ref="messagesEl" @scroll="onMessagesScroll">
        <!-- 流式状态摘要栏 -->
        <div v-if="busy" class="stream-status-bar">
          <div class="stream-status-left">
            <span class="stream-status-dot-anim"></span>
            <span class="stream-status-phase">{{ streamStatusPhase }}</span>
          </div>
          <div class="stream-status-center">
            <span v-if="completedStepsCount > 0" class="stream-status-steps">步骤 {{ completedStepsCount }}/{{ totalStepsEstimate }}</span>
            <div class="stream-status-progress-track">
              <div class="stream-status-progress-fill" :style="{ width: overallProgress + '%' }"></div>
            </div>
          </div>
          <div class="stream-status-right">
            <span class="stream-status-elapsed">{{ formattedElapsed }}</span>
          </div>
        </div>
        <div v-if="messages.length === 0 && !busy" class="empty-hint">
          <p>发送消息开始与 Agent 对话</p>
        </div>
        <div v-for="(msg, i) in messages" :key="msg.key" class="message" :class="msg.role">
          <div class="msg-avatar">
            <span v-if="msg.role === 'user'">U</span>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6a1 1 0 0 0-1 1v5a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V7a1 1 0 0 0-1-1z"/></svg>
          </div>
          <div class="msg-body">
            <!-- user -->
            <template v-if="msg.role === 'user'">
              <div class="user-bubble user-bubble--md">
                <MarkdownView :content="msg.content" mode="dark" />
              </div>
            </template>
            <!-- assistant：流式阶段绑定顶层 ref，避免嵌套对象不触发视图更新 -->
            <template v-else>
              <template v-if="msg.streamingLive">
                <template v-if="streamingSegments.length">
                  <template v-for="(seg, si) in streamingSegments" :key="`live-${si}`">
                    <div v-if="seg.kind === 'text'" class="agent-text">
                      <MarkdownView :content="seg.content" mode="dark" />
                    </div>
                  </template>
                </template>
                <template v-else-if="streamingHtml">
                  <WorkshopStreamProgress
                    :phase="2"
                    :char-count="streamingHtml.length"
                    :html-buffer="streamingHtml"
                  />
                  <div class="stream-code-shell">
                    <div class="stream-code-header">
                      <span class="stream-code-title">HTML 源码预览</span>
                      <button
                        type="button"
                        class="stream-code-copy"
                        :disabled="!streamingHtml"
                        @click="copyStreamingHtml"
                      >
                        {{ streamHtmlCopied ? '✓ 已复制' : '复制' }}
                      </button>
                    </div>
                    <div class="agent-text agent-text--stream" v-html="renderEscapedSource(streamingHtml)"></div>
                  </div>
                </template>
              </template>
              <template v-else>
                <template v-for="(seg, si) in msg.segments" :key="si">
                  <div v-if="seg.kind === 'text'" class="agent-text">
                    <MarkdownView :content="seg.content" mode="dark" />
                  </div>
                  <div v-else-if="seg.kind === 'html_source'" class="agent-html-source">
                    <div class="stream-code-header stream-code-header--static">
                      <span class="stream-code-title">HTML 源码</span>
                      <button
                        type="button"
                        class="stream-code-copy"
                        @click="copyHtmlSegment(seg.content, htmlSegCopyId(msg, si))"
                      >
                        {{ htmlSegCopiedId === htmlSegCopyId(msg, si) ? '✓ 已复制' : '复制' }}
                      </button>
                    </div>
                    <pre class="agent-html-source-pre"><code>{{ seg.content }}</code></pre>
                  </div>
                  <div v-else class="agent-card" :class="'card-' + seg.type">
                    <div class="agent-card-header" @click="seg.open = !seg.open">
                      <span class="card-icon">{{ seg.icon }}</span>
                      <span class="card-title-text">{{ seg.title }}</span>
                      <svg class="chevron" :class="{ open: seg.open }" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                    <div v-if="seg.open" class="agent-card-body">
                      <pre v-if="seg.type === 'bash'" class="bash-block"><code>{{ seg.content }}</code></pre>
                      <MarkdownView v-else :content="seg.content" mode="dark" />
                    </div>
                  </div>
                </template>
              </template>
            </template>
            <div class="msg-time">{{ msg.time }}</div>
          </div>
        </div>
        <div v-if="loading" class="message assistant">
          <div class="msg-avatar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/></svg>
          </div>
          <div class="msg-body">
            <div class="typing-dots"><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>
      <Transition name="scroll-btn">
        <button
          v-if="userScrolledUp"
          type="button"
          class="scroll-to-bottom-btn"
          @click="forceScrollBottom"
          title="回到底部"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          <span v-if="newChunksWhileScrolledUp" class="scroll-btn-badge">有新内容</span>
        </button>
      </Transition>

      <div class="input-area">
        <textarea
          v-model="inputText"
          placeholder="输入消息..."
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
          ref="textareaEl"
        ></textarea>
        <button class="mic-btn" :class="{ recording: isRecording }" :title="isRecording ? '停止录音' : '语音输入'" @click="toggleRecording">
          <svg v-if="!isRecording" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="2" width="6" height="12" rx="3"/>
            <path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2"/>
          </svg>
        </button>
        <button class="send-btn" :disabled="!inputText.trim() || busy" @click="sendMessage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider" @mousedown="startDrag"></div>

    <!-- Right: Preview Panel -->
    <div class="results-panel">
      <div class="results-header">
        <span class="results-title">成果展示</span>
        <div class="header-actions">
          <button
            class="icon-btn"
            :class="{ 'icon-btn--active': showWorkspaceFiles }"
            title="切换文件目录"
            @click="toggleWorkspaceFiles"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </button>
          <!-- [容器池功能暂时禁用]
          <button class="icon-btn" :class="{ 'icon-btn--active': showSandboxPool }" title="查看沙箱池状态" @click="toggleSandboxPool">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="7" height="7" rx="1.5"/>
              <rect x="14" y="4" width="7" height="7" rx="1.5"/>
              <rect x="3" y="15" width="7" height="7" rx="1.5"/>
              <path d="M17.5 15v6M14.5 18h6"/>
            </svg>
          </button>
          -->
          <button class="icon-btn" :class="{ 'icon-btn--active': showAgentDoDebug }" title="切换 Agent-Do 调试信息" @click="toggleAgentDoDebug">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </button>
          <span v-if="previewMode !== 'empty'" class="mode-tag">{{ previewMode === 'html' ? '预览' : previewMode === 'url' ? 'URL' : previewCode.lang }}</span>
          <button v-if="previewMode === 'html' || previewMode === 'url'" class="icon-btn" title="刷新预览" @click="iframeKey++; urlLoadError = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      </div>

      <div class="results-content" :class="{ 'results-content--with-files': showWorkspaceFiles }">
        <aside v-if="showWorkspaceFiles" class="workspace-browser">
          <div class="workspace-browser-header">
            <div>
              <div class="workspace-browser-title">文件目录</div>
              <div class="workspace-browser-subtitle">{{ workspaceBrowserSubtitle }}</div>
            </div>
            <button type="button" class="workspace-refresh-btn" :disabled="workspaceTreeLoading" @click="loadWorkspaceTree(true)">
              {{ workspaceTreeLoading ? '刷新中' : '刷新' }}
            </button>
          </div>
          <div v-if="workspaceTreeError" class="workspace-browser-error">{{ workspaceTreeError }}</div>
          <div v-else-if="workspaceTreeLoading && !workspaceTreeRoot" class="workspace-browser-empty">正在加载文件目录…</div>
          <div v-else-if="!workspaceFlatNodes.length" class="workspace-browser-empty">当前会话还没有可浏览的文件。</div>
          <div v-else class="workspace-tree">
            <button
              v-for="node in workspaceFlatNodes"
              :key="node.path || `dir-${node.name}`"
              type="button"
              class="workspace-tree-node"
              :class="[
                `node-${node.type}`,
                {
                  'is-selected': workspaceSelectedFile.path === node.path,
                  'is-directory-open': node.type === 'directory' && isDirectoryExpanded(node.path),
                },
              ]"
              :style="{ paddingLeft: `${14 + node.depth * 18}px` }"
              @click="handleWorkspaceNodeClick(node)"
            >
              <span class="workspace-tree-caret">
                <svg
                  v-if="node.type === 'directory'"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  :class="{ open: isDirectoryExpanded(node.path) }"
                >
                  <polyline points="8 4 16 12 8 20"/>
                </svg>
              </span>
              <span class="workspace-tree-icon">{{ node.type === 'directory' ? '📁' : fileIcon(node.path) }}</span>
              <span class="workspace-tree-label">{{ node.name }}</span>
            </button>
          </div>
        </aside>

        <div class="results-main">
          <div v-if="showWorkspaceFiles" class="results-tabs">
            <button
              type="button"
              class="results-tab"
              :class="{ active: workspaceActiveView === 'preview' }"
              @click="workspaceActiveView = 'preview'"
            >
              预览
            </button>
            <button
              v-if="workspaceSelectedFile.path"
              type="button"
              class="results-tab"
              :class="{ active: workspaceActiveView === 'file' }"
              @click="workspaceActiveView = 'file'"
            >
              {{ workspaceSelectedFile.name || workspaceSelectedFile.path }}
            </button>
          </div>

          <div v-if="showWorkspaceFiles && workspaceActiveView === 'file'" class="file-viewer">
            <div class="file-viewer-header">
              <div>
                <div class="file-viewer-title">{{ workspaceSelectedFile.name || '选择文件' }}</div>
                <div class="file-viewer-subtitle">{{ workspaceSelectedFile.path || '从左侧文件目录中选择一个文件以查看内容。' }}</div>
              </div>
              <button
                v-if="workspaceSelectedFile.path"
                type="button"
                class="workspace-refresh-btn"
                :disabled="workspaceFileLoading"
                @click="loadWorkspaceFile(workspaceSelectedFile.path, true)"
              >
                {{ workspaceFileLoading ? '加载中' : '重新读取' }}
              </button>
            </div>
            <div v-if="workspaceFileError" class="file-viewer-error">{{ workspaceFileError }}</div>
            <div v-else-if="workspaceFileLoading" class="file-viewer-empty">正在读取文件内容…</div>
            <div v-else-if="workspaceSelectedFile.binary" class="file-viewer-empty">该文件是二进制内容，当前仅支持文本预览。</div>
            <div v-else-if="workspaceSelectedFile.content" class="file-viewer-body">
              <div v-if="workspaceSelectedFile.truncated" class="file-viewer-notice">文件较大，当前仅展示前 256 KB 内容。</div>
              <pre class="file-viewer-code"><code>{{ workspaceSelectedFile.content }}</code></pre>
            </div>
            <div v-else class="file-viewer-empty">从左侧文件目录中选择一个文件以查看内容。</div>
          </div>

          <template v-else>
        <!-- [容器池功能暂时禁用]
        <div v-if="showSandboxPool" class="sandbox-pool-panel">
          <div class="sandbox-pool-header">
            <div>
              <div class="sandbox-pool-title">沙箱池状态</div>
              <div class="sandbox-pool-subtitle">活跃 {{ sandboxPool.activeCount }} / {{ sandboxPool.maxContainers }}，空闲回收 {{ formatIdleTtl(sandboxPool.idleTtlMs) }}</div>
            </div>
            <button type="button" class="sandbox-pool-refresh" :disabled="sandboxPoolLoading" @click="loadSandboxPool">
              {{ sandboxPoolLoading ? '刷新中' : '刷新' }}
            </button>
          </div>
          <div v-if="sandboxPoolError" class="sandbox-pool-error">{{ sandboxPoolError }}</div>
          <div class="sandbox-pool-grid">
            <div class="sandbox-pool-card">
              <div class="sandbox-pool-card-title">当前活跃容器</div>
              <div v-if="sandboxPool.activeSandboxes.length" class="sandbox-pool-list">
                <div v-for="item in sandboxPool.activeSandboxes" :key="`${item.username}-${item.conversationId}`" class="sandbox-pool-item">
                  <div class="sandbox-pool-item-title">{{ item.username }} / {{ item.conversationId }}</div>
                  <div class="sandbox-pool-item-meta">{{ item.containerName }} · {{ item.kind }} · 端口 {{ item.port }}</div>
                  <div class="sandbox-pool-item-meta">最近访问 {{ formatPoolTime(item.lastAccessedAt) }}</div>
                </div>
              </div>
              <div v-else class="sandbox-pool-empty">当前没有活跃沙箱</div>
            </div>
            <div class="sandbox-pool-card">
              <div class="sandbox-pool-card-title">最近回收记录</div>
              <div v-if="sandboxPool.reclaimedSandboxes.length" class="sandbox-pool-list">
                <div v-for="item in sandboxPool.reclaimedSandboxes" :key="`${item.workspacePath}-${item.reclaimedAt}`" class="sandbox-pool-item">
                  <div class="sandbox-pool-item-title">{{ item.username }} / {{ item.conversationId }}</div>
                  <div class="sandbox-pool-item-meta">{{ formatReclaimReason(item.reclaimReason) }}</div>
                  <div class="sandbox-pool-item-meta">回收于 {{ formatPoolTime(item.reclaimedAt) }}</div>
                </div>
              </div>
              <div v-else class="sandbox-pool-empty">暂时没有回收记录</div>
            </div>
          </div>
        </div>
        -->
        <div v-if="showAgentDoDebug" class="debug-panel">
          <div class="debug-panel-header">
            <span class="debug-panel-title">Agent-Do 调试信息</span>
          </div>
          <div class="debug-grid">
            <div class="debug-item">
              <div class="debug-label">Request Payload</div>
              <pre class="debug-value"><code>{{ requestPayloadText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">Phase Timing</div>
              <pre class="debug-value"><code>{{ phaseTimingText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">Event Timeline</div>
              <pre class="debug-value"><code>{{ timelineText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">当前会话 ID</div>
              <pre class="debug-value"><code>{{ agentDoDebug.sessionId || '-' }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">当前工作目录</div>
              <pre class="debug-value"><code>{{ agentDoDebug.workspacePath || '-' }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">正在执行的工具</div>
              <pre class="debug-value"><code>{{ activeToolsText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">工具输入/输出</div>
              <pre class="debug-value"><code>{{ toolLogsText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">文本增量</div>
              <pre class="debug-value"><code>{{ agentDoDebug.textDelta || '-' }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">todo 列表</div>
              <pre class="debug-value"><code>{{ todoText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">权限请求</div>
              <pre class="debug-value"><code>{{ permissionText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">最终预览 URL</div>
              <pre class="debug-value"><code>{{ agentDoDebug.previewUrl || '-' }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">最近一次错误</div>
              <pre class="debug-value"><code>{{ agentDoDebug.lastError || '-' }}</code></pre>
            </div>
          </div>
        </div>
        <div v-else-if="previewMode === 'empty'" class="results-empty">
          <div class="preview-waiting-shell" :class="{ 'is-busy': busy }">
            <div class="preview-waiting-orb">
              <div class="preview-waiting-ring"></div>
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M3 8.5h18"/>
                <path d="M8.5 21V8.5"/>
              </svg>
            </div>
            <div class="preview-waiting-title">{{ busy ? '预览准备中' : '成果展示区' }}</div>
            <div class="preview-waiting-text">
              {{ busy ? previewWaitingText : '生成后的网页、代码或链接会显示在这里。' }}
            </div>
            <div v-if="busy" class="preview-waiting-tips">
              <span>生成代码</span>
              <span>启动服务</span>
              <span>校验预览</span>
            </div>
          </div>
        </div>
        <iframe
          v-else-if="previewMode === 'html'"
          :key="iframeKey"
          :srcdoc="previewHtml"
          class="preview-iframe"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          @load="handlePreviewLoad"
        ></iframe>
        <div v-else-if="previewMode === 'url'" class="url-preview">
          <div class="preview-status-bar" :class="`status-${previewStatus.kind}`">
            <div class="preview-status-main">
              <span class="preview-status-dot"></span>
              <div>
                <div class="preview-status-title">{{ previewStatus.title }}</div>
                <div class="preview-status-subtitle">{{ previewStatus.subtitle }}</div>
              </div>
            </div>
            <span class="preview-status-chip">{{ previewStatus.chip }}</span>
          </div>
          <div class="url-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            <span class="url-text">{{ previewUrl }}</span>
            <a :href="previewUrl" target="_blank" class="url-open-btn" title="在新标签页打开">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              新标签打开
            </a>
          </div>
          <iframe
            v-if="!urlLoadError"
            :key="'url-' + iframeKey"
            :src="previewUrl"
            class="preview-iframe"
            tabindex="0"
            @load="handlePreviewLoad($event)"
            @error="handlePreviewError"
          ></iframe>
          <div v-else class="url-fallback">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <p>该页面不支持嵌入预览</p>
            <a :href="previewUrl" target="_blank" class="fallback-link">点击在新标签页中打开 →</a>
          </div>
        </div>
        <div v-else-if="previewMode === 'code'" class="code-preview">
          <div class="code-preview-header">
            <span class="code-lang-tag">{{ previewCode.lang }}</span>
            <button class="copy-btn" @click="copyCode" :class="{ copied: codeCopied }">
              {{ codeCopied ? '✓ 已复制' : '复制' }}
            </button>
          </div>
          <pre class="code-preview-body"><code>{{ previewCode.content }}</code></pre>
        </div>
          </template>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { logout as logoutApi } from '../api/auth.js'
import {
  // fetchAgentDoSandboxPool, // [容器池功能暂时禁用]
  fetchAgentDoWorkspaceFile,
  fetchAgentDoWorkspaceTree,
  normalizeWorkshopPreviewUrl,
  streamGenerate,
  streamPreviewWithAgentDo,
  uploadHTML,
} from '../api/workshop.js'
import {
  deleteWorkshopConversation,
  fetchWorkshopConversations,
  saveWorkshopConversation,
} from '../api/workshopConversations.js'
import WorkshopStreamProgress from '../components/WorkshopStreamProgress.vue'
import MarkdownView from '../components/MarkdownView.vue'
import { clearCurrentUser, getCurrentUser, getUserDisplayName } from '../utils/auth.js'
import { createEmptyConversation } from '../utils/workshopHistory.js'

const router = useRouter()
const currentUser = ref(getCurrentUser())
const userDisplayName = computed(() => getUserDisplayName(currentUser.value) || '未登录')
const sidebarExpanded = ref(false)

// ── Layout / drag ──────────────────────────────────────────────
const workshopEl = ref(null)
const leftWidth = ref(40)
let dragging = false
let startX = 0
let startW = 0

function startDrag(e) {
  dragging = true
  startX = e.clientX
  startW = leftWidth.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = 'none')
}
function onDrag(e) {
  if (!dragging || !workshopEl.value) return
  const total = workshopEl.value.offsetWidth
  const delta = ((e.clientX - startX) / total) * 100
  leftWidth.value = Math.min(60, Math.max(25, startW + delta))
}
function stopDrag() {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.querySelectorAll('iframe').forEach(f => f.style.pointerEvents = '')
}

// ── Chat state ─────────────────────────────────────────────────
let messageKeySeq = 0
function allocMessageKey() {
  messageKeySeq += 1
  return messageKeySeq
}

const messages = ref([])
const inputText = ref('')
/** SSE：给用户看的说明（Markdown） */
const streamingFriendly = ref('')
/** SSE：HTML 源码（转义后展示） */
const streamingHtml = ref('')
const streamingSegments = ref([])
/** 整段请求进行中（含 SSE 与上传），用于禁用发送避免重复提交 */
const busy = ref(false)
/** 仅用于底部「打字点」：首包前的等待、上传阶段 */
const loading = ref(false)
const chatTitle = ref('Agent 对话')
const messagesEl = ref(null)
const textareaEl = ref(null)
const conversationList = ref([])
const currentConversationId = ref('')
const editingConversationId = ref('')
const editingTitle = ref('')
let historyHydrating = false
let persistTimer = null
const historyReady = ref(false)

// ── Right panel state ──────────────────────────────────────────
const previewMode = ref('empty')
const previewHtml = ref('')
const previewUrl = ref('')
const previewCode = ref({ lang: '', content: '' })
const iframeKey = ref(0)
const codeCopied = ref(false)
const urlLoadError = ref(false)
const previewFrameState = ref('idle')
const showAgentDoDebug = ref(false)
// const showSandboxPool = ref(false) // [容器池功能暂时禁用]
const showWorkspaceFiles = ref(false)
const agentDoDebug = ref({
  requestPayload: null,
  timeline: [],
  requestStartedAt: 0,
  firstEventAt: 0,
  requestCompletedAt: 0,
  stageMarks: {},
  sessionId: '',
  workspacePath: '',
  activeTools: [],
  toolLogs: [],
  textDelta: '',
  todos: [],
  permissions: [],
  previewUrl: '',
  lastError: '',
})
const agentDoLive = ref({
  steps: [],
  reasoning: '',
  answer: '',
})
/* [容器池功能暂时禁用]
const sandboxPoolLoading = ref(false)
const sandboxPoolError = ref('')
const sandboxPool = ref({
  runtimeRoot: '',
  activeCount: 0,
  maxContainers: 0,
  idleTtlMs: 0,
  activeSandboxes: [],
  reclaimedSandboxes: [],
})
*/
const workspaceActiveView = ref('preview')
const workspaceTreeLoading = ref(false)
const workspaceTreeError = ref('')
const workspaceTreeRoot = ref(null)
const workspaceExpandedDirs = ref([''])
const workspaceFileLoading = ref(false)
const workspaceFileError = ref('')
const workspaceSelectedFile = ref({
  path: '',
  name: '',
  content: '',
  binary: false,
  truncated: false,
  size: 0,
})

const currentWorkspaceRequest = computed(() => {
  const username = currentUser.value?.username || 'workshop_guest'
  const conversationId = currentConversationId.value || ''
  return {
    username,
    conversationId,
    ready: Boolean(username && conversationId),
  }
})

const workspaceBrowserSubtitle = computed(() => {
  if (workspaceTreeLoading.value) return '正在同步会话 workspace'
  if (workspaceTreeRoot.value) return '点击目录展开，点击文件查看内容'
  return '当前会话的 Agent-Do 工作目录'
})

const workspaceFlatNodes = computed(() => {
  const root = workspaceTreeRoot.value
  if (!root) return []

  const nodes = []
  const walk = (node, depth = 0) => {
    if (node.path || depth > 0) {
      nodes.push({
        ...node,
        depth,
      })
    }
    if (node.type !== 'directory') return
    if (depth > 0 && !isDirectoryExpanded(node.path)) return
    for (const child of node.children || []) {
      walk(child, depth + (depth > 0 ? 1 : 0))
    }
  }

  walk(root, 0)
  return nodes
})

function resetWorkspaceBrowser() {
  workspaceTreeLoading.value = false
  workspaceTreeError.value = ''
  workspaceTreeRoot.value = null
  workspaceExpandedDirs.value = ['']
  workspaceFileLoading.value = false
  workspaceFileError.value = ''
  workspaceSelectedFile.value = {
    path: '',
    name: '',
    content: '',
    binary: false,
    truncated: false,
    size: 0,
  }
  workspaceActiveView.value = 'preview'
}

function isDirectoryExpanded(path) {
  return workspaceExpandedDirs.value.includes(path || '')
}

function toggleDirectoryExpanded(path) {
  const key = path || ''
  if (isDirectoryExpanded(key)) {
    workspaceExpandedDirs.value = workspaceExpandedDirs.value.filter((item) => item !== key)
  } else {
    workspaceExpandedDirs.value = [...workspaceExpandedDirs.value, key]
  }
}

function fileIcon(path) {
  const lower = String(path || '').toLowerCase()
  if (lower.endsWith('.html')) return '🌐'
  if (lower.endsWith('.css')) return '🎨'
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return '🟨'
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return '🟦'
  if (lower.endsWith('.json')) return '🧩'
  if (lower.endsWith('.md')) return '📝'
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg')) return '🖼️'
  return '📄'
}

function findFirstFileNode(node) {
  if (!node) return null
  if (node.type === 'file') return node
  for (const child of node.children || []) {
    const found = findFirstFileNode(child)
    if (found) return found
  }
  return null
}

async function loadWorkspaceTree(force = false) {
  if (!currentWorkspaceRequest.value.ready) return
  if (workspaceTreeLoading.value) return
  if (workspaceTreeRoot.value && !force) return

  workspaceTreeLoading.value = true
  workspaceTreeError.value = ''
  try {
    const data = await fetchAgentDoWorkspaceTree(currentWorkspaceRequest.value)
    workspaceTreeRoot.value = data?.root || null
    const rootChildren = Array.isArray(data?.root?.children) ? data.root.children : []
    workspaceExpandedDirs.value = ['']
    for (const child of rootChildren) {
      if (child?.type === 'directory') {
        workspaceExpandedDirs.value.push(child.path || '')
      }
    }

    const stillSelected = workspaceSelectedFile.value.path
      ? workspaceFlatNodes.value.find((item) => item.path === workspaceSelectedFile.value.path)
      : null
    if (stillSelected?.type === 'file') {
      await loadWorkspaceFile(stillSelected.path, true)
    } else if (!workspaceSelectedFile.value.path) {
      const firstFile = findFirstFileNode(data?.root)
      if (firstFile?.path) {
        await loadWorkspaceFile(firstFile.path)
      }
    }
  } catch (error) {
    workspaceTreeError.value = error instanceof Error ? error.message : String(error)
  } finally {
    workspaceTreeLoading.value = false
  }
}

async function loadWorkspaceFile(path, force = false) {
  const nextPath = String(path || '').trim()
  if (!currentWorkspaceRequest.value.ready || !nextPath) return
  if (workspaceFileLoading.value && workspaceSelectedFile.value.path === nextPath) return
  if (!force && workspaceSelectedFile.value.path === nextPath && workspaceSelectedFile.value.content) {
    workspaceActiveView.value = 'file'
    return
  }

  workspaceFileLoading.value = true
  workspaceFileError.value = ''
  workspaceActiveView.value = 'file'
  try {
    const data = await fetchAgentDoWorkspaceFile({
      ...currentWorkspaceRequest.value,
      path: nextPath,
    })
    workspaceSelectedFile.value = {
      path: data?.path || nextPath,
      name: data?.name || nextPath.split('/').pop() || nextPath,
      content: typeof data?.content === 'string' ? data.content : '',
      binary: Boolean(data?.binary),
      truncated: Boolean(data?.truncated),
      size: Number(data?.size || 0),
    }
  } catch (error) {
    workspaceFileError.value = error instanceof Error ? error.message : String(error)
  } finally {
    workspaceFileLoading.value = false
  }
}

function handleWorkspaceNodeClick(node) {
  if (!node) return
  if (node.type === 'directory') {
    toggleDirectoryExpanded(node.path)
    return
  }
  loadWorkspaceFile(node.path)
}

async function toggleWorkspaceFiles() {
  showWorkspaceFiles.value = !showWorkspaceFiles.value
  if (!showWorkspaceFiles.value) return
  // showSandboxPool.value = false // [容器池功能暂时禁用]
  showAgentDoDebug.value = false
  await loadWorkspaceTree()
}

// ── Smart auto-scroll ──────────────────────────────────────────
const userScrolledUp = ref(false)
const newChunksWhileScrolledUp = ref(false)
const SCROLL_THRESHOLD = 80

function isNearBottom() {
  const el = messagesEl.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD
}

function onMessagesScroll() {
  if (!busy.value) {
    userScrolledUp.value = false
    newChunksWhileScrolledUp.value = false
    return
  }
  userScrolledUp.value = !isNearBottom()
  if (!userScrolledUp.value) {
    newChunksWhileScrolledUp.value = false
  }
}

function forceScrollBottom() {
  userScrolledUp.value = false
  newChunksWhileScrolledUp.value = false
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

// ── Elapsed timer ──────────────────────────────────────────────
const streamStartTime = ref(0)
const elapsedSeconds = ref(0)
let elapsedTimer = null

function startElapsedTimer() {
  streamStartTime.value = Date.now()
  elapsedSeconds.value = 0
  if (elapsedTimer) clearInterval(elapsedTimer)
  elapsedTimer = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - streamStartTime.value) / 1000)
  }, 1000)
}

function stopElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
}

const formattedElapsed = computed(() => {
  const s = elapsedSeconds.value
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}m ${r}s` : `${m}m`
})

// ── Overall progress tracking ──────────────────────────────────
const completedStepsCount = computed(() => {
  const steps = agentDoLive.value.steps.filter(s => s.stage === 'result').length
  const completedTools = agentDoDebug.value.toolLogs.filter(t => t.status === 'completed').length
  return steps + completedTools
})

const totalStepsEstimate = computed(() => {
  const base = agentDoLive.value.steps.length
  const totalTools = agentDoDebug.value.toolLogs.length
  const pending = agentDoDebug.value.toolLogs.filter(t => t.status === 'running' || t.status === 'pending').length
  const total = base + totalTools + pending
  return Math.max(total, completedStepsCount.value + 1, 3)
})

const overallProgress = computed(() => {
  if (!busy.value) return 0
  const total = totalStepsEstimate.value
  if (total <= 0) return 5
  const raw = Math.round((completedStepsCount.value / total) * 100)
  return Math.max(5, Math.min(95, raw))
})

const streamStatusPhase = computed(() => {
  if (!busy.value) return ''
  const lastStep = agentDoLive.value.steps[agentDoLive.value.steps.length - 1]
  if (lastStep?.content) return lastStep.content
  const runningTools = agentDoDebug.value.toolLogs.filter(t => t.status === 'running')
  if (runningTools.length) return `正在执行: ${runningTools.map(t => t.title).join(', ')}`
  if (loading.value) return '正在准备…'
  return 'Agent-Do 正在处理'
})

const agentDoStepItems = computed(() => agentDoLive.value.steps.slice(-8))
const visibleToolLogs = computed(() => {
  const priority = { running: 0, pending: 1, error: 2, completed: 3 }
  return [...agentDoDebug.value.toolLogs]
    .sort((left, right) => {
      const leftScore = priority[left.status] ?? 9
      const rightScore = priority[right.status] ?? 9
      if (leftScore !== rightScore) return leftScore - rightScore
      return String(left.title || '').localeCompare(String(right.title || ''))
    })
    .slice(0, 6)
})
const agentDoTodoItems = computed(() => agentDoDebug.value.todos || [])
const agentDoReasoningPreview = computed(() => agentDoLive.value.reasoning.trim())
const agentDoAnswerPreview = computed(() => agentDoLive.value.answer.trim())
const hasAgentDoLivePanel = computed(() => {
  return Boolean(
    agentDoStepItems.value.length
    || visibleToolLogs.value.length
    || agentDoTodoItems.value.length
    || agentDoReasoningPreview.value
    || agentDoAnswerPreview.value
    || agentDoDebug.value.previewUrl,
  )
})
const agentDoCurrentTitle = computed(() => {
  const lastStep = agentDoStepItems.value[agentDoStepItems.value.length - 1]
  if (lastStep?.content) return lastStep.content
  if (visibleToolLogs.value.length) return '正在执行 Agent-Do 工具链'
  return 'Agent-Do 正在构建项目'
})
const previewWaitingText = computed(() => {
  if (agentDoDebug.value.previewUrl) return '预览地址已经返回，正在载入页面内容。'
  if (agentDoStepItems.value.length) {
    return agentDoStepItems.value[agentDoStepItems.value.length - 1].content
  }
  return loading.value ? '正在上传，完成后即可预览。' : 'Agent-Do 正在生成代码并启动预览服务。'
})
const agentDoAccordionItems = computed(() => {
  const items = []

  for (const step of agentDoStepItems.value) {
    items.push({
      key: `step-${step.id}`,
      kind: 'step',
      icon: '◉',
      title: formatAgentDoStage(step.stage),
      subtitle: step.content,
      detail: step.content,
      state: step.stage === 'result' ? 'completed' : 'running',
      badge: step.stage === 'result' ? '完成' : '进行中',
      expanded: Boolean(step.expanded),
      target: step,
    })
  }

  if (agentDoReasoningPreview.value) {
    items.push({
      key: 'reasoning',
      kind: 'reasoning',
      icon: '💡',
      title: '思考过程',
      subtitle: summarizePlainText(agentDoReasoningPreview.value, 88),
      detail: agentDoReasoningPreview.value,
      state: 'idle',
      badge: '',
      expanded: Boolean(agentDoLive.value.reasoningExpanded),
      target: agentDoLive.value,
      toggleKey: 'reasoningExpanded',
    })
  }

  for (const tool of visibleToolLogs.value) {
    items.push({
      key: tool.key,
      kind: 'tool',
      icon: toolIcon(tool),
      title: tool.title,
      subtitle: `${summarizeToolLog(tool)} · 耗时 ${formatToolDuration(tool)}`,
      detail: '',
      state: tool.status,
      badge: formatToolStatus(tool.status),
      expanded: Boolean(tool.expanded),
      input: tool.input,
      output: tool.output,
      error: tool.error,
      target: tool,
    })
  }

  if (agentDoTodoItems.value.length) {
    items.push({
      key: 'todo',
      kind: 'todo',
      icon: '☰',
      title: '更新计划',
      subtitle: `${agentDoTodoItems.value.length} 个待办项`,
      detail: agentDoTodoItems.value.map((todo) => `• ${todo.status} / ${todo.priority} / ${todo.content}`).join('\n'),
      state: 'idle',
      badge: '',
      expanded: Boolean(agentDoLive.value.todoExpanded),
      target: agentDoLive.value,
      toggleKey: 'todoExpanded',
    })
  }

  if (agentDoAnswerPreview.value) {
    items.push({
      key: 'answer',
      kind: 'answer',
      icon: '✦',
      title: '生成输出',
      subtitle: summarizePlainText(agentDoAnswerPreview.value, 88),
      detail: agentDoAnswerPreview.value,
      state: 'completed',
      badge: '',
      expanded: Boolean(agentDoLive.value.answerExpanded),
      target: agentDoLive.value,
      toggleKey: 'answerExpanded',
    })
  }

  if (agentDoDebug.value.previewUrl) {
    items.push({
      key: 'result',
      kind: 'result',
      icon: '↗',
      title: '最终预览 URL',
      subtitle: summarizePlainText(agentDoDebug.value.previewUrl, 88),
      detail: agentDoDebug.value.previewUrl,
      url: agentDoDebug.value.previewUrl,
      state: 'completed',
      badge: '可访问',
      expanded: Boolean(agentDoLive.value.resultExpanded),
      target: agentDoLive.value,
      toggleKey: 'resultExpanded',
    })
  }

  return items
})
const allAccordionExpanded = computed(() => {
  const items = agentDoAccordionItems.value
  return items.length > 0 && items.every((item) => item.expanded)
})

function buildTraceAccordionItems(trace) {
  if (!trace) return []
  const items = []
  const steps = Array.isArray(trace.steps) ? trace.steps.slice(-8) : []
  const toolLogs = Array.isArray(trace.toolLogs) ? [...trace.toolLogs] : []
  const todos = Array.isArray(trace.todos) ? trace.todos : []
  const reasoning = String(trace.reasoning || '').trim()
  const answer = String(trace.answer || '').trim()
  const previewUrl = String(trace.previewUrl || '').trim()
  const requestPayload = trace.requestPayload
    ? JSON.stringify({
      ...trace.requestPayload,
      systemPrompt: trace.requestPayload.systemPrompt ? '[same prompt as the Agent-Do request]' : '',
    }, null, 2)
    : ''
  const timeline = Array.isArray(trace.timeline) && trace.timeline.length
    ? trace.timeline
      .map((item) => {
        const header = `[+${formatDebugDuration(item.offsetMs)}] ${item.summary}`
        return item.detail ? `${header}\n${item.detail}` : header
      })
      .join('\n\n')
    : ''

  for (const step of steps) {
    items.push({
      key: `trace-step-${step.id}`,
      kind: 'step',
      icon: '•',
      title: formatAgentDoStage(step.stage),
      subtitle: step.content,
      detail: step.content,
      state: step.stage === 'result' ? 'completed' : 'running',
      badge: step.stage === 'result' ? '完成' : '进行中',
      expanded: Boolean(step.expanded),
      target: step,
    })
  }

  if (requestPayload) {
    trace.requestExpanded = trace.requestExpanded ?? false
    items.push({
      key: 'trace-request',
      kind: 'request',
      icon: '{}',
      title: '本次请求',
      subtitle: summarizePlainText(requestPayload, 88),
      detail: requestPayload,
      state: 'idle',
      badge: '',
      expanded: Boolean(trace.requestExpanded),
      target: trace,
      toggleKey: 'requestExpanded',
    })
  }

  if (reasoning) {
    trace.reasoningExpanded = trace.reasoningExpanded ?? false
    items.push({
      key: 'trace-reasoning',
      kind: 'reasoning',
      icon: '🧠',
      title: '思考过程',
      subtitle: summarizePlainText(reasoning, 88),
      detail: reasoning,
      state: 'idle',
      badge: '',
      expanded: Boolean(trace.reasoningExpanded),
      target: trace,
      toggleKey: 'reasoningExpanded',
    })
  }

  for (const tool of toolLogs.slice(0, 8)) {
    items.push({
      key: `trace-tool-${tool.key}`,
      kind: 'tool',
      icon: toolIcon(tool),
      title: tool.title,
      subtitle: `${summarizeToolLog(tool)} · 耗时 ${formatToolDuration(tool)}`,
      detail: '',
      state: tool.status,
      badge: formatToolStatus(tool.status),
      expanded: Boolean(tool.expanded),
      input: tool.input,
      output: tool.output,
      error: tool.error,
      target: tool,
    })
  }

  if (todos.length) {
    trace.todoExpanded = trace.todoExpanded ?? false
    items.push({
      key: 'trace-todo',
      kind: 'todo',
      icon: '☰',
      title: '待办计划',
      subtitle: `${todos.length} 个待办项`,
      detail: todos.map((todo) => `• ${todo.status} / ${todo.priority} / ${todo.content}`).join('\n'),
      state: 'idle',
      badge: '',
      expanded: Boolean(trace.todoExpanded),
      target: trace,
      toggleKey: 'todoExpanded',
    })
  }

  if (answer) {
    trace.answerExpanded = trace.answerExpanded ?? true
    items.push({
      key: 'trace-answer',
      kind: 'answer',
      icon: '✓',
      title: '生成输出',
      subtitle: summarizePlainText(answer, 88),
      detail: answer,
      state: 'completed',
      badge: '',
      expanded: Boolean(trace.answerExpanded),
      target: trace,
      toggleKey: 'answerExpanded',
    })
  }

  if (previewUrl) {
    trace.resultExpanded = trace.resultExpanded ?? true
    items.push({
      key: 'trace-result',
      kind: 'result',
      icon: '→',
      title: '最终预览 URL',
      subtitle: summarizePlainText(previewUrl, 88),
      detail: previewUrl,
      url: previewUrl,
      state: 'completed',
      badge: '可访问',
      expanded: Boolean(trace.resultExpanded),
      target: trace,
      toggleKey: 'resultExpanded',
    })
  }

  if (timeline) {
    trace.timelineExpanded = trace.timelineExpanded ?? false
    items.push({
      key: 'trace-timeline',
      kind: 'timeline',
      icon: '⏱',
      title: '事件时间线',
      subtitle: summarizePlainText(timeline, 88),
      detail: timeline,
      state: 'idle',
      badge: '',
      expanded: Boolean(trace.timelineExpanded),
      target: trace,
      toggleKey: 'timelineExpanded',
    })
  }

  return items
}

function getTraceTitle(trace) {
  const items = buildTraceAccordionItems(trace)
  const step = items.find((item) => item.kind === 'step')
  if (step?.subtitle) return step.subtitle
  if (trace?.previewUrl) return 'Agent-Do 已完成生成与预览'
  return 'Agent-Do 对话记录'
}

function getTraceAccordionItems(trace) {
  return buildTraceAccordionItems(trace)
}

function isTraceAccordionExpanded(trace) {
  const items = buildTraceAccordionItems(trace)
  return items.length > 0 && items.every((item) => item.expanded)
}

function toggleTraceAccordionItem(item) {
  toggleAccordionItem(item)
}

function toggleAllTraceAccordionItems(trace) {
  const items = buildTraceAccordionItems(trace)
  const nextExpanded = !(items.length > 0 && items.every((item) => item.expanded))
  for (const item of items) {
    if (!item?.target) continue
    if (item.toggleKey) item.target[item.toggleKey] = nextExpanded
    else item.target.expanded = nextExpanded
  }
}
const previewStatus = computed(() => {
  if (previewMode.value === 'empty') {
    return {
      kind: busy.value ? 'waiting' : 'idle',
      title: busy.value ? '预览中' : '等待开始',
      subtitle: busy.value ? previewWaitingText.value : '生成完成后会在这里自动显示预览。',
      chip: busy.value ? '运行中' : '空闲',
    }
  }
  if (urlLoadError.value || previewFrameState.value === 'error') {
    return {
      kind: 'error',
      title: '地址可用，但嵌入预览失败',
      subtitle: '可以继续通过新标签页访问最终页面。',
      chip: '嵌入失败',
    }
  }
  if (previewFrameState.value === 'loaded') {
    return {
      kind: 'ready',
      title: '地址可用',
      subtitle: '预览页面已经成功加载。',
      chip: '已就绪',
    }
  }
  return {
    kind: agentDoDebug.value.previewUrl ? 'loading' : 'waiting',
    title: agentDoDebug.value.previewUrl ? '服务启动中' : '预览中',
    subtitle: agentDoDebug.value.previewUrl
      ? '地址已经返回，正在等待页面资源加载。'
      : previewWaitingText.value,
    chip: agentDoDebug.value.previewUrl ? '加载中' : '准备中',
  }
})

const activeToolsText = computed(() => {
  if (!agentDoDebug.value.activeTools.length) return '-'
  return agentDoDebug.value.activeTools.join('\n')
})

const toolLogsText = computed(() => {
  if (!agentDoDebug.value.toolLogs.length) return '-'
  return agentDoDebug.value.toolLogs
    .map((item) => [
      `[${item.status}] ${item.title}`,
      `input:\n${item.input || '-'}`,
      `output:\n${item.output || '-'}`,
      item.error ? `error:\n${item.error}` : null,
    ].filter(Boolean).join('\n'))
    .join('\n\n')
})

const todoText = computed(() => {
  if (!agentDoDebug.value.todos.length) return '-'
  return agentDoDebug.value.todos
    .map((todo) => `${todo.status} | ${todo.priority} | ${todo.content}`)
    .join('\n')
})

const permissionText = computed(() => {
  if (!agentDoDebug.value.permissions.length) return '-'
  return agentDoDebug.value.permissions
    .map((item) => `${item.permission}: ${item.patterns.join(', ') || '当前任务'}`)
    .join('\n')
})

const requestPayloadText = computed(() => {
  if (!agentDoDebug.value.requestPayload) return '-'
  const payload = { ...agentDoDebug.value.requestPayload }
  if (typeof payload.systemPrompt === 'string' && payload.systemPrompt) {
    payload.systemPrompt = '[same prompt as the actual Agent-Do stream request]'
  }
  return JSON.stringify(payload, null, 2)
})

function formatDebugDuration(ms) {
  const value = Number(ms || 0)
  if (!value) return '0ms'
  if (value < 1000) return `${value}ms`
  const seconds = (value / 1000).toFixed(value < 10_000 ? 2 : 1)
  return `${seconds}s`
}

function formatRelativeDebugTime(timestamp) {
  const startedAt = Number(agentDoDebug.value.requestStartedAt || 0)
  const at = Number(timestamp || 0)
  if (!startedAt || !at) return '-'
  return formatDebugDuration(Math.max(0, at - startedAt))
}

const firstEventText = computed(() => {
  if (!agentDoDebug.value.firstEventAt) return '-'
  return formatRelativeDebugTime(agentDoDebug.value.firstEventAt)
})

const phaseTimingText = computed(() => {
  const startedAt = Number(agentDoDebug.value.requestStartedAt || 0)
  if (!startedAt) return '-'

  const marks = agentDoDebug.value.stageMarks || {}
  const completedAt = Number(agentDoDebug.value.requestCompletedAt || 0)
  const lines = []

  if (agentDoDebug.value.firstEventAt) {
    lines.push(`request -> first_event: ${formatRelativeDebugTime(agentDoDebug.value.firstEventAt)}`)
  }

  const orderedStages = ['workspace', 'session', 'sandbox', 'generate', 'preview', 'result']
  let previousAt = startedAt
  for (const stage of orderedStages) {
    const at = Number(marks[stage] || 0)
    if (!at) continue
    lines.push(`${stage}: +${formatDebugDuration(Math.max(0, at - previousAt))} (total ${formatRelativeDebugTime(at)})`)
    previousAt = at
  }

  if (completedAt) {
    lines.push(`stream_done: +${formatDebugDuration(Math.max(0, completedAt - previousAt))} (total ${formatRelativeDebugTime(completedAt)})`)
  }

  return lines.length ? lines.join('\n') : '-'
})

const timelineText = computed(() => {
  if (!agentDoDebug.value.timeline.length) return '-'
  return agentDoDebug.value.timeline
    .map((item) => {
      const header = `[+${formatDebugDuration(item.offsetMs)}] ${item.summary}`
      return item.detail ? `${header}\n${item.detail}` : header
    })
    .join('\n\n')
})

function cloneMessages(list) {
  return JSON.parse(JSON.stringify(Array.isArray(list) ? list : []))
}

function resetAgentDoDebug() {
  agentDoDebug.value = {
    requestPayload: null,
    timeline: [],
    requestStartedAt: 0,
    firstEventAt: 0,
    requestCompletedAt: 0,
    stageMarks: {},
    sessionId: '',
    workspacePath: '',
    activeTools: [],
    toolLogs: [],
    textDelta: '',
    todos: [],
    permissions: [],
    previewUrl: '',
    lastError: '',
  }
  agentDoLive.value = {
    steps: [],
    reasoning: '',
    answer: '',
    reasoningExpanded: false,
    answerExpanded: false,
    todoExpanded: false,
    resultExpanded: true,
  }
  previewFrameState.value = 'idle'
}

function buildAgentDoTraceSnapshot() {
  return JSON.parse(JSON.stringify({
    requestPayload: agentDoDebug.value.requestPayload || null,
    timeline: agentDoDebug.value.timeline || [],
    requestStartedAt: agentDoDebug.value.requestStartedAt || 0,
    firstEventAt: agentDoDebug.value.firstEventAt || 0,
    requestCompletedAt: agentDoDebug.value.requestCompletedAt || 0,
    stageMarks: agentDoDebug.value.stageMarks || {},
    sessionId: agentDoDebug.value.sessionId || '',
    workspacePath: agentDoDebug.value.workspacePath || '',
    toolLogs: agentDoDebug.value.toolLogs || [],
    textDelta: agentDoDebug.value.textDelta || '',
    todos: agentDoDebug.value.todos || [],
    permissions: agentDoDebug.value.permissions || [],
    previewUrl: agentDoDebug.value.previewUrl || '',
    lastError: agentDoDebug.value.lastError || '',
    steps: agentDoLive.value.steps || [],
    reasoning: agentDoLive.value.reasoning || '',
    answer: agentDoLive.value.answer || '',
    reasoningExpanded: Boolean(agentDoLive.value.reasoningExpanded),
    answerExpanded: Boolean(agentDoLive.value.answerExpanded),
    todoExpanded: Boolean(agentDoLive.value.todoExpanded),
    resultExpanded: Boolean(agentDoLive.value.resultExpanded),
    elapsed: formattedElapsed.value,
  }))
}

/* [容器池功能暂时禁用]
async function loadSandboxPool() {
  sandboxPoolLoading.value = true
  sandboxPoolError.value = ''
  try {
    sandboxPool.value = await fetchAgentDoSandboxPool()
  } catch (error) {
    sandboxPoolError.value = error instanceof Error ? error.message : String(error)
  } finally {
    sandboxPoolLoading.value = false
  }
}

async function toggleSandboxPool() {
  showSandboxPool.value = !showSandboxPool.value
  if (showSandboxPool.value) {
    showAgentDoDebug.value = false
    showWorkspaceFiles.value = false
    await loadSandboxPool()
  }
}
*/

function toggleAgentDoDebug() {
  showAgentDoDebug.value = !showAgentDoDebug.value
  if (showAgentDoDebug.value) {
    // showSandboxPool.value = false // [容器池功能暂时禁用]
    showWorkspaceFiles.value = false
  }
}

function buildConversationSnapshot() {
  const current = conversationList.value.find((item) => item.id === currentConversationId.value)
  return {
    id: currentConversationId.value,
    title: chatTitle.value || '新对话',
    createdAt: current?.createdAt || new Date().toISOString(),
    messages: cloneMessages(messages.value),
    updatedAt: new Date().toISOString(),
    preview: {
      mode: previewMode.value,
      html: previewHtml.value,
      url: previewUrl.value,
      code: { ...previewCode.value },
    },
  }
}

function applyConversation(conversation) {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  cancelRename()
  historyHydrating = true
  currentConversationId.value = conversation.id
  chatTitle.value = conversation.title || '新对话'
  messages.value = cloneMessages(conversation.messages || [])
  previewMode.value = conversation.preview?.mode || 'empty'
  previewHtml.value = conversation.preview?.html || ''
  previewUrl.value = normalizeWorkshopPreviewUrl(conversation.preview?.url || '')
  previewFrameState.value = previewUrl.value || previewHtml.value ? 'loading' : 'idle'
  previewCode.value = {
    lang: conversation.preview?.code?.lang || '',
    content: conversation.preview?.code?.content || '',
  }
  streamingFriendly.value = ''
  streamingHtml.value = ''
  resetAgentDoDebug()
  resetWorkspaceBrowser()
  urlLoadError.value = false
  nextTick(() => {
    historyHydrating = false
    scrollBottom()
  })
}

async function persistConversations() {
  if (historyHydrating || !historyReady.value || !currentUser.value?.username || !currentConversationId.value) return
  const snapshot = buildConversationSnapshot()
  const nextList = [...conversationList.value]
  const index = nextList.findIndex((item) => item.id === snapshot.id)
  if (index >= 0) {
    nextList[index] = {
      ...nextList[index],
      ...snapshot,
      createdAt: nextList[index].createdAt || snapshot.updatedAt,
    }
  } else {
    nextList.unshift({
      ...snapshot,
      createdAt: snapshot.updatedAt,
    })
  }
  nextList.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  conversationList.value = nextList
  const saved = await saveWorkshopConversation(snapshot)
  const savedIndex = conversationList.value.findIndex((item) => item.id === saved.id)
  if (savedIndex >= 0) {
    const merged = [...conversationList.value]
    merged[savedIndex] = {
      ...merged[savedIndex],
      ...saved,
    }
    merged.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    conversationList.value = merged
  }
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(async () => {
    await persistConversations()
    persistTimer = null
  }, 120)
}

async function createNewConversation() {
  const conversation = createEmptyConversation()
  conversationList.value = [conversation, ...conversationList.value]
  applyConversation(conversation)
  await persistConversations()
  sidebarExpanded.value = true
  startRename(conversation.id)
}

function switchConversation(id) {
  if (!id || id === currentConversationId.value || busy.value || editingConversationId.value) return
  const conversation = conversationList.value.find((item) => item.id === id)
  if (conversation) applyConversation(conversation)
}

async function deleteConversation(id) {
  if (!id || conversationList.value.length <= 1 || busy.value) return
  const conversation = conversationList.value.find((item) => item.id === id)
  const targetTitle = conversation?.title || '该对话'
  const confirmed = window.confirm(`确定删除“${targetTitle}”吗？删除后无法恢复。`)
  if (!confirmed) return
  try {
    await deleteWorkshopConversation(id)
  } catch (e) {
    console.error('delete conversation failed:', e)
  }
  const nextList = conversationList.value.filter((item) => item.id !== id)
  conversationList.value = nextList
  if (currentConversationId.value === id && nextList[0]) {
    applyConversation(nextList[0])
  }
}

async function loadWorkshopHistory() {
  if (!currentUser.value?.username) {
    router.push('/login')
    return
  }
  const conversations = await fetchWorkshopConversations()
  conversationList.value = conversations
  let current = conversations[0]
  if (!current) {
    current = createEmptyConversation()
    conversationList.value = [current]
    historyReady.value = true
    applyConversation(current)
    await persistConversations()
    return
  }
  applyConversation(current)
  historyReady.value = true
}

async function logout() {
  await logoutApi().catch(() => null)
  clearCurrentUser()
  router.push('/login')
}

function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value
}

function conversationInputId(id) {
  return `conversation-title-input-${id}`
}

function focusRenameInput(id) {
  nextTick(() => {
    const el = document.getElementById(conversationInputId(id))
    if (el instanceof HTMLInputElement) {
      el.focus()
      el.select()
    }
  })
}

function startRename(id) {
  if (!id) return
  const conversation = conversationList.value.find((item) => item.id === id)
  if (!conversation) return
  editingConversationId.value = id
  editingTitle.value = conversation.title || '新对话'
  sidebarExpanded.value = true
  focusRenameInput(id)
}

function cancelRename() {
  editingConversationId.value = ''
  editingTitle.value = ''
}

async function commitRename(id) {
  if (!id || editingConversationId.value !== id) return
  const title = String(editingTitle.value || '').trim() || '新对话'
  const index = conversationList.value.findIndex((item) => item.id === id)
  if (index === -1) {
    cancelRename()
    return
  }
  const nextList = [...conversationList.value]
  nextList[index] = {
    ...nextList[index],
    title,
  }
  conversationList.value = nextList
  if (currentConversationId.value === id) {
    chatTitle.value = title
  }
  cancelRename()

  try {
    if (currentConversationId.value === id) {
      await persistConversations()
    } else {
      await saveWorkshopConversation(nextList[index])
    }
  } catch (e) {
    // 改名先保证前端立即生效；若后端同步失败，保留当前标题，避免用户感觉“没反应”。
    console.error('rename conversation failed:', e)
  }
}

function formatConversationTime(raw) {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

/* [容器池功能暂时禁用]
function formatPoolTime(raw) {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatIdleTtl(ms) {
  const totalSeconds = Math.max(0, Math.round(Number(ms || 0) / 1000))
  if (!totalSeconds) return '-'
  if (totalSeconds < 60) return `${totalSeconds} 秒`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return seconds ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分钟`
}

function formatReclaimReason(reason) {
  const map = {
    'idle-timeout': '空闲超时回收',
    'pool-limit': '超过容器池上限',
  }
  return map[reason] || reason || '-'
}
*/

function formatAgentDoStage(stage) {
  const map = {
    workspace: '工作目录',
    session: '会话绑定',
    generate: '代码生成',
    preview: '预览启动',
    result: '预览完成',
  }
  return map[stage] || '处理中'
}

function formatToolStatus(status) {
  const map = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    error: '失败',
  }
  return map[status] || status || '处理中'
}

function summarizePlainText(text, maxLength = 120) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim()
  if (!normalized) return '暂无详细内容'
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}...`
}

function toolIcon(tool) {
  if (tool.status === 'error') return '⚠'
  if (tool.status === 'completed') return '✓'
  if (tool.title?.toLowerCase().includes('read')) return '📄'
  if (tool.title?.toLowerCase().includes('bash') || tool.title?.toLowerCase().includes('command')) return '⌘'
  if (tool.title?.toLowerCase().includes('write') || tool.title?.toLowerCase().includes('edit')) return '✎'
  return tool.status === 'running' ? '◌' : '◦'
}

function formatToolDuration(tool) {
  const startedAt = Number(tool.startedAt || 0)
  const endedAt = Number(tool.endedAt || tool.updatedAt || Date.now())
  if (!startedAt) return '-'
  const seconds = Math.max(0, Math.round((endedAt - startedAt) / 1000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return remain ? `${minutes}m ${remain}s` : `${minutes}m`
}

function summarizeToolLog(tool) {
  const content = tool.error || tool.output || tool.input || ''
  const normalized = String(content).replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Agent-Do 正在处理该步骤…'
  if (normalized.length <= 180) return normalized
  return `${normalized.slice(0, 180)}...`
}

function toggleAccordionItem(item) {
  if (!item?.target) return
  if (item.toggleKey) {
    item.target[item.toggleKey] = !item.target[item.toggleKey]
    return
  }
  item.target.expanded = !item.target.expanded
}

function toggleAllAccordionItems() {
  const nextExpanded = !allAccordionExpanded.value
  for (const item of agentDoAccordionItems.value) {
    if (!item?.target) continue
    if (item.toggleKey) {
      item.target[item.toggleKey] = nextExpanded
    } else {
      item.target.expanded = nextExpanded
    }
  }
}

/** 右侧仅在整段 HTML 生成结束（及上传结束）后首次展示，流式过程中不更新 iframe */
function flushPreviewImmediate(html) {
  previewHtml.value = html
  previewMode.value = 'html'
  previewFrameState.value = 'loading'
}

function handlePreviewLoad(event) {
  previewFrameState.value = 'loaded'
  urlLoadError.value = false
  if (event?.target?.focus) {
    event.target.focus()
  }
}

function handlePreviewError() {
  previewFrameState.value = 'error'
  urlLoadError.value = true
}

function copyCode() {
  navigator.clipboard.writeText(previewCode.value.content).then(() => {
    codeCopied.value = true
    setTimeout(() => { codeCopied.value = false }, 2000)
  })
}

const streamHtmlCopied = ref(false)
function copyStreamingHtml() {
  const t = streamingHtml.value
  if (!t) return
  navigator.clipboard.writeText(t).then(() => {
    streamHtmlCopied.value = true
    setTimeout(() => { streamHtmlCopied.value = false }, 2000)
  })
}

const htmlSegCopiedId = ref('')
function htmlSegCopyId(msg, si) {
  return `h-${msg.key}-${si}`
}
function copyHtmlSegment(text, id) {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    htmlSegCopiedId.value = id
    setTimeout(() => {
      if (htmlSegCopiedId.value === id) htmlSegCopiedId.value = ''
    }, 2000)
  })
}

// ── Voice input ────────────────────────────────────────────────
const isRecording = ref(false)
let recognition = null

function toggleRecording() {
  if (isRecording.value) {
    recognition && recognition.stop()
    isRecording.value = false
    return
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) { alert('浏览器不支持语音识别'); return }
  recognition = new SR()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onresult = (e) => { inputText.value += e.results[0][0].transcript; autoResize() }
  recognition.onend = () => { isRecording.value = false }
  recognition.start()
  isRecording.value = true
}

// ── Textarea auto-resize ───────────────────────────────────────
function autoResize() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

// ── Title extraction ───────────────────────────────────────────
function extractTitle(text) {
  const m = text.match(/帮我(?:生成|做|创建|开发|写|设计).*?([^\s，,。！!？?]{2,8})(?:系统|平台|工具|页面|应用|网站|程序)?/)
  if (m) return m[1] + (text.match(/系统|平台|工具|页面|应用|网站|程序/) || [''])[0]
  return null
}

// ── 流式 HTML 源码展示（勿当 Markdown 解析，仅转义 + 换行） ───────
function renderEscapedSource(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

function cloneSegments(list) {
  return JSON.parse(JSON.stringify(Array.isArray(list) ? list : []))
}

function getStreamingSegment(id) {
  return streamingSegments.value.find((item) => item._streamId === id)
}

function upsertStreamingText(id, content) {
  const existing = getStreamingSegment(id)
  if (existing) {
    existing.content = content
    return existing
  }
  const segment = { _streamId: id, kind: 'text', content }
  streamingSegments.value.push(segment)
  return segment
}

function upsertStreamingCard(id, next) {
  const existing = getStreamingSegment(id)
  if (existing) {
    Object.assign(existing, next)
    return existing
  }
  const segment = { _streamId: id, kind: 'card', open: true, ...next }
  streamingSegments.value.push(segment)
  return segment
}

function formatTodoContent(todos) {
  if (!Array.isArray(todos) || todos.length === 0) {
    return '当前没有待办项。'
  }
  return todos
    .map((todo) => `- [${todo.status}] ${todo.content} (${todo.priority})`)
    .join('\n')
}

function buildAgentDoChatMarkdown({ answer, previewUrl, elapsed } = {}) {
  const sections = []
  const finalAnswer = String(answer || '').trim()
  if (finalAnswer) {
    sections.push(finalAnswer)
  }
  if (previewUrl) {
    sections.push(`预览链接：[打开预览](${previewUrl})`)
  }
  if (elapsed && previewUrl) {
    sections.push(`已完成，耗时 ${elapsed}。`)
  }
  return sections.join('\n\n').trim()
}

function buildAgentDoAssistantSegments({ previewUrl, elapsed } = {}) {
  const content = buildAgentDoChatMarkdown({
    answer: agentDoLive.value.answer,
    previewUrl: previewUrl || agentDoDebug.value.previewUrl,
    elapsed,
  })
  if (!content) return []
  return [{ kind: 'text', content }]
}

function syncAgentDoStreamingAnswer({ previewUrl } = {}) {
  const content = buildAgentDoChatMarkdown({
    answer: agentDoLive.value.answer,
    previewUrl: previewUrl || agentDoDebug.value.previewUrl,
  })
  if (!content) return null
  return upsertStreamingText('agentDo-answer', content)
}

function syncAgentDoStreamingPlaceholder(content) {
  const text = String(content || '').trim()
  if (!text) return null
  if (String(agentDoLive.value.answer || '').trim()) return null
  return upsertStreamingText('agentDo-answer', text)
}

function pushAgentDoTimeline(summary, detail = '') {
  const now = Date.now()
  if (!agentDoDebug.value.firstEventAt) {
    agentDoDebug.value.firstEventAt = now
  }
  const startedAt = Number(agentDoDebug.value.requestStartedAt || now)
  const nextItem = {
    key: `${now}-${agentDoDebug.value.timeline.length}`,
    at: now,
    offsetMs: Math.max(0, now - startedAt),
    summary,
    detail,
  }
  agentDoDebug.value.timeline = [...agentDoDebug.value.timeline, nextItem].slice(-200)
}

function markAgentDoStage(stage) {
  if (!stage) return
  if (agentDoDebug.value.stageMarks[stage]) return
  agentDoDebug.value.stageMarks = {
    ...agentDoDebug.value.stageMarks,
    [stage]: Date.now(),
  }
}

function applyAgentDoStreamEvent(event) {
  if (!event || typeof event !== 'object') return null
  const eventSummary = event.type === 'status'
    ? `status/${event.stage || 'status'}: ${event.content || ''}`
    : event.type === 'tool'
      ? `tool/${event.status || 'pending'}: ${event.title || event.tool || 'tool'}`
      : event.type === 'delta'
        ? `${event.partType || 'delta'}: ${summarizePlainText(event.content || '', 80)}`
        : event.type === 'meta'
          ? `meta/session=${event.agentDoSessionId || '-'}`
          : event.type === 'todo'
            ? `todo: ${Array.isArray(event.todos) ? event.todos.length : 0} items`
            : event.type === 'permission'
              ? `permission: ${event.permission || '-'}`
              : event.type === 'result'
                ? 'result: preview url ready'
                : event.type === 'error'
                  ? `error: ${event.content || 'Agent-Do stream failed'}`
                  : String(event.type || 'unknown')
  pushAgentDoTimeline(eventSummary, JSON.stringify(event, null, 2))

  if (event.type === 'status') {
    const content = String(event.content || '').trim()
    markAgentDoStage(event.stage || 'status')
    if (content) {
      const last = agentDoLive.value.steps[agentDoLive.value.steps.length - 1]
      if (!last || last.content !== content) {
        agentDoLive.value.steps.push({
          id: `${event.stage || 'status'}-${Date.now()}-${agentDoLive.value.steps.length}`,
          stage: event.stage || 'status',
          content,
        })
      }
    }
    const statusText = event.stage === 'session'
      ? '正在建立 Agent-Do 会话...'
      : event.stage === 'generate'
        ? 'Agent-Do 正在生成中...'
        : event.stage === 'preview'
          ? 'Agent-Do 已完成生成，正在启动预览...'
          : content || 'Agent-Do 正在处理中...'
    syncAgentDoStreamingPlaceholder(statusText)
    return null
  }

  if (event.type === 'meta') {
    agentDoDebug.value.sessionId = event.agentDoSessionId || ''
    agentDoDebug.value.workspacePath = event.workspacePath || ''
    syncAgentDoStreamingPlaceholder('正在连接 Agent-Do...')
    return null
  }

  if (event.type === 'delta') {
    if (event.partType === 'reasoning') {
      agentDoLive.value.reasoning += event.content || ''
    } else {
      agentDoLive.value.answer += event.content || ''
      syncAgentDoStreamingAnswer()
    }
    agentDoDebug.value.textDelta += event.content || ''
    return null
  }

  if (event.type === 'tool') {
    const active = new Set(agentDoDebug.value.activeTools)
    if (event.status === 'running' || event.status === 'pending') {
      active.add(`${event.title} (${event.status})`)
    } else {
      Array.from(active).forEach((item) => {
        if (item.startsWith(`${event.title} (`)) active.delete(item)
      })
    }
    agentDoDebug.value.activeTools = Array.from(active)
    const toolKey = `${event.tool}-${event.title}`
    const previous = agentDoDebug.value.toolLogs.find((item) => item.key === toolKey)
    const startedAt = previous?.startedAt || Date.now()
    const updatedAt = Date.now()
    const endedAt = event.status === 'completed' || event.status === 'error'
      ? updatedAt
      : previous?.endedAt || null
    agentDoDebug.value.toolLogs = [
      ...agentDoDebug.value.toolLogs.filter((item) => item.key !== toolKey),
      {
        key: toolKey,
        title: event.title,
        status: event.status,
        input: event.input || '',
        output: event.output || '',
        error: event.error || '',
        startedAt,
        updatedAt,
        endedAt,
        expanded: previous?.expanded ?? (event.status === 'running' || event.status === 'error'),
      },
    ]
    if (event.status === 'running' || event.status === 'pending') {
      syncAgentDoStreamingPlaceholder(`Agent-Do 正在执行 ${event.title || event.tool || '任务'}...`)
    }
    return null
  }

  if (event.type === 'todo') {
    agentDoDebug.value.todos = Array.isArray(event.todos) ? event.todos : []
    return null
  }

  if (event.type === 'permission') {
    agentDoDebug.value.permissions = [
      ...agentDoDebug.value.permissions,
      {
        permission: event.permission || '',
        patterns: Array.isArray(event.patterns) ? event.patterns : [],
      },
    ]
    return null
  }

  if (event.type === 'result') {
    markAgentDoStage('result')
    agentDoDebug.value.sessionId = event.agentDoSessionId || agentDoDebug.value.sessionId
    agentDoDebug.value.workspacePath = event.workspacePath || agentDoDebug.value.workspacePath
    agentDoDebug.value.previewUrl = event.url || ''
    agentDoLive.value.steps.push({
      id: `result-${Date.now()}`,
      stage: 'result',
      content: '预览地址已生成，可以开始加载页面。',
    })
    syncAgentDoStreamingAnswer({ previewUrl: event.url })
    return event
  }

  if (event.type === 'error') {
    agentDoDebug.value.lastError = event.content || 'Agent-Do 流式生成失败'
    throw new Error(event.content || 'Agent-Do 流式生成失败')
  }

  return null
}

// ── HTML 输出兜底清洗：避免说明文字/代码围栏混入部署文件 ───────
function normalizeGeneratedHtml(raw) {
  if (!raw) return ''
  let s = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim()

  // 兼容模型误输出 markdown 围栏
  s = s.replace(/^```(?:html)?\s*/i, '')
  s = s.replace(/\s*```$/i, '')

  // 优先从 doctype 起截取；否则从 <html 起截取
  const lower = s.toLowerCase()
  const docIdx = lower.indexOf('<!doctype html')
  const htmlIdx = lower.indexOf('<html')
  let start = -1
  if (docIdx !== -1) start = docIdx
  else if (htmlIdx !== -1) start = htmlIdx
  if (start > 0) s = s.slice(start)

  // 若存在 </html>，截断其后的噪声文本
  const endHtml = s.toLowerCase().lastIndexOf('</html>')
  if (endHtml !== -1) {
    s = s.slice(0, endHtml + '</html>'.length)
  }

  return s.trim()
}

// 强制让模型生成的单文件页面“铺满”当前预览 iframe，避免出现左右大片留白或右侧固定宽度导致的“长度不匹配”。
function enforceWorkshopPreviewFit(html) {
  if (!html) return html
  const fitCss = `
html, body {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}
.container, main, .right-panel, .left-panel, .preview-frame, .preview-iframe {
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
}
.right-panel {
  flex: 1 1 auto !important;
  min-width: 0 !important;
}
.preview-frame, iframe {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
}
`

  // 优先插入到 </head> 前，保证更高优先级且不依赖模型结构
  if (html.includes('</head>')) {
    return html.replace('</head>', `<style>${fitCss}</style></head>`)
  }
  return `${html}<style>${fitCss}</style>`
}

// ── Send message ───────────────────────────────────────────────
async function sendLegacyMessage(options = {}) {
  const text = (options.textOverride ?? inputText.value).trim()
  if (!text || busy.value) return

  const title = extractTitle(text)
  if (title) chatTitle.value = title

  if (!options.skipUserPush) {
    messages.value.push({ key: allocMessageKey(), role: 'user', content: text, time: nowTime() })
    inputText.value = ''
    if (textareaEl.value) textareaEl.value.style.height = 'auto'
  }
  busy.value = true
  loading.value = true
  userScrolledUp.value = false
  newChunksWhileScrolledUp.value = false
  startElapsedTimer()
  previewHtml.value = ''
  previewMode.value = 'empty'
  scrollBottom()

  const assistantMsg = {
    key: allocMessageKey(),
    role: 'assistant',
    segments: [],
    streamingLive: true,
    time: ''
  }
  messages.value.push(assistantMsg)
  streamingFriendly.value = ''
  streamingHtml.value = ''
  loading.value = false

  let generatedHTML = ''
  let cleanedHTML = ''
  try {
    for await (const part of streamGenerate(
      text,
      '你是资深前端与交互设计师，擅长用单个 HTML 文件实现完整、美观、可交互的页面；'
      + '面向用户的说明需写清功能定位、结构亮点，并交代两阶段输出与右侧预览的进度含义。'
    )) {
      if (part.kind === 'friendly') {
        streamingFriendly.value += part.content
      } else {
        streamingHtml.value += part.content
        generatedHTML += part.content
      }
      await nextTick()
      scrollBottom()
    }

    const friendlyText = streamingFriendly.value.trim()
    cleanedHTML = normalizeGeneratedHtml(generatedHTML)
    cleanedHTML = enforceWorkshopPreviewFit(cleanedHTML)
    const htmlText = cleanedHTML.trim()

    if (!htmlText) {
      assistantMsg.streamingLive = false
      streamingFriendly.value = ''
      streamingHtml.value = ''
      const hint = friendlyText
        ? `${friendlyText}\n\n`
        : ''
      assistantMsg.segments = [
        {
          kind: 'text',
          content:
            `${hint}⚠️ 未识别到页面 HTML（模型需先写说明，再单独一行输出分隔符 \`<<<HTML_BEGIN>>>\`，其后跟完整 HTML）。请重试或简化需求。`,
        },
      ]
    } else {
      assistantMsg.streamingLive = false
      streamingFriendly.value = ''
      streamingHtml.value = ''

      // 生成完成后，上传到 OSS
      loading.value = true
      assistantMsg.segments = [
        { kind: 'text', content: '📤 正在上传文件…' },
      ]
      await nextTick()
      scrollBottom()

      const fileName = `workshop-${Date.now()}.html`
      const { url } = await uploadHTML(fileName, cleanedHTML)

      // 更新消息：说明 + 完成提示 + 预览卡片 + 窄列展示的 HTML 源码
      assistantMsg.segments = [
        { kind: 'text', content: '✅ **已完成** 已上传，可在右侧预览或新标签打开。' },
        {
          kind: 'card',
          type: 'result',
          icon: '🌐',
          title: '在线预览',
          content: url,
          open: true,
        },
        { kind: 'html_source', content: cleanedHTML },
      ]

      // 右侧仅在全部生成并上传成功后首次用 URL 加载（流式过程中不刷新 iframe）
      previewUrl.value = url
      previewMode.value = 'url'
      iframeKey.value++
    }

  } catch (e) {
    assistantMsg.streamingLive = false
    assistantMsg.agentDoTrace = buildAgentDoTraceSnapshot()
    streamingFriendly.value = ''
    streamingHtml.value = ''
    const errorMsg = e.name === 'AbortError'
      ? '⚠️ 请求超时，请稍后重试'
      : `⚠️ 请求失败：${e.message}`
    const segs = [{ kind: 'text', content: errorMsg }]
    if (cleanedHTML?.trim()) {
      segs.push({ kind: 'html_source', content: cleanedHTML.trim() })
      flushPreviewImmediate(enforceWorkshopPreviewFit(cleanedHTML.trim()))
    }
    assistantMsg.segments = segs
  } finally {
    agentDoDebug.value.requestCompletedAt = Date.now()
    stopElapsedTimer()
    busy.value = false
    loading.value = false
    userScrolledUp.value = false
    newChunksWhileScrolledUp.value = false
  }

  assistantMsg.time = nowTime()
  await nextTick()
  forceScrollBottom()
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || busy.value) return

  const title = extractTitle(text)
  if (title) chatTitle.value = title

  messages.value.push({ key: allocMessageKey(), role: 'user', content: text, time: nowTime() })
  inputText.value = ''
  if (textareaEl.value) textareaEl.value.style.height = 'auto'

  const assistantMsg = {
    key: allocMessageKey(),
    role: 'assistant',
    segments: [],
    streamingLive: true,
    time: ''
  }
  messages.value.push(assistantMsg)
  streamingSegments.value = [{ _streamId: 'agentDo-answer', kind: 'text', content: 'Agent-Do 正在处理中...' }]
  resetAgentDoDebug()
  const requestPayload = {
    context: text,
    systemPrompt: '浣犳槸璧勬繁鍓嶇寮€鍙戣€呫€傚浜庢父鎴忋€佸姩鐢汇€佸伐鍏烽〉闈㈢瓑绾墠绔渶姹傦紝鐩存帴鐢熸垚鍗曚釜 index.html锛堝唴鑱旀墍鏈?JS/CSS锛夛紝涓嶈鍒涘缓 npm 椤圭洰銆傚彧鏈夌敤鎴锋槑纭姹傛鏋舵椂鎵嶇敤 Vite銆傝拷姹備竴姝ュ埌浣嶏紝鍑忓皯鏂囦欢鎿嶄綔娆℃暟銆?',
    conversationId: currentConversationId.value || `conv-${Date.now()}`,
    username: currentUser.value?.username || 'workshop_guest',
    title: title || chatTitle.value || 'Workshop Project',
  }
  agentDoDebug.value.requestPayload = requestPayload
  agentDoDebug.value.requestStartedAt = Date.now()
  scrollBottom()

  try {
    busy.value = true
    loading.value = false
    userScrolledUp.value = false
    newChunksWhileScrolledUp.value = false
    startElapsedTimer()
    previewHtml.value = ''
    previewMode.value = 'empty'
    previewFrameState.value = 'idle'

    let finalResult = null
    for await (const event of streamPreviewWithAgentDo({
      context: text,
      systemPrompt: '你是资深前端开发者。对于游戏、动画、工具页面等纯前端需求，直接生成单个 index.html（内联所有 JS/CSS），不要创建 npm 项目。只有用户明确要求框架时才用 Vite。追求一步到位，减少文件操作次数。',
      conversationId: currentConversationId.value || `conv-${Date.now()}`,
      username: currentUser.value?.username || 'workshop_guest',
      title: title || chatTitle.value || 'Workshop Project',
    })) {
      const maybeResult = applyAgentDoStreamEvent(event)
      if (maybeResult?.url) {
        finalResult = maybeResult
        previewUrl.value = maybeResult.url
        previewMode.value = 'url'
        previewFrameState.value = 'loading'
        iframeKey.value++
      }
      await nextTick()
      scrollBottom()
    }

    agentDoDebug.value.requestCompletedAt = Date.now()
    stopElapsedTimer()
    assistantMsg.streamingLive = false
    assistantMsg.segments = buildAgentDoAssistantSegments({
      previewUrl: finalResult?.url,
      elapsed: formattedElapsed.value,
    })
    assistantMsg.time = nowTime()
    streamingSegments.value = []
    if (!finalResult) {
      throw new Error('Agent-Do 未返回预览地址')
    }
    await loadWorkspaceTree(true)
    await nextTick()
    forceScrollBottom()
  } catch (_error) {
    stopElapsedTimer()
    assistantMsg.streamingLive = false
    assistantMsg.agentDoTrace = buildAgentDoTraceSnapshot()
    assistantMsg.segments = [
      {
        kind: 'text',
        content: `⚠️ Agent-Do 生成失败：${_error instanceof Error ? _error.message : String(_error)}`,
      },
    ]
    assistantMsg.time = nowTime()
    streamingSegments.value = []
    busy.value = false
    loading.value = false
    await nextTick()
    forceScrollBottom()
    return
  } finally {
    stopElapsedTimer()
    busy.value = false
    loading.value = false
    userScrolledUp.value = false
    newChunksWhileScrolledUp.value = false
  }
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
function scrollBottom() {
  nextTick(() => {
    if (!messagesEl.value) return
    if (userScrolledUp.value) {
      newChunksWhileScrolledUp.value = true
      return
    }
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}
function clearChat() {
  messages.value = []
  streamingFriendly.value = ''
  streamingHtml.value = ''
  streamingSegments.value = []
  resetAgentDoDebug()
  resetWorkspaceBrowser()
  chatTitle.value = '新对话'
  previewMode.value = 'empty'
  previewHtml.value = ''
  previewUrl.value = ''
  previewFrameState.value = 'idle'
  previewCode.value = { lang: '', content: '' }
  urlLoadError.value = false
  persistConversations()
}

onMounted(async () => {
  try {
    await loadWorkshopHistory()
  } catch (e) {
    const fallback = createEmptyConversation()
    conversationList.value = [fallback]
    historyReady.value = true
    applyConversation(fallback)
  }
})

watch(
  [messages, chatTitle, previewMode, previewHtml, previewUrl, previewCode],
  () => {
    if (historyHydrating) return
    schedulePersist()
  },
  { deep: true },
)

watch(
  () => currentConversationId.value,
  async () => {
    resetWorkspaceBrowser()
    if (showWorkspaceFiles.value && currentWorkspaceRequest.value.ready) {
      await loadWorkspaceTree(true)
    }
  },
)

onBeforeUnmount(() => {
  stopDrag()
  stopElapsedTimer()
  if (persistTimer) clearTimeout(persistTimer)
  persistConversations()
})
</script>

<style scoped>
.workshop {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-base, #0f0f13);
  color: var(--text-primary, #e8e8f0);
  font-family: 'Inter', sans-serif;
}

.history-sidebar {
  width: 74px;
  flex-shrink: 0;
  height: 100%;
  background: rgba(31, 31, 34, 0.98);
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  padding: 16px 12px 18px;
  overflow: hidden;
  transition: width 0.28s ease, padding 0.28s ease;
}

.history-sidebar.expanded {
  width: 320px;
  padding: 16px 18px 18px;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}

.history-sidebar.expanded .sidebar-top {
  flex-direction: row;
  justify-content: space-between;
}

.sidebar-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.sidebar-icon-btn:hover {
  background: rgba(255,255,255,0.08);
  transform: translateY(-1px);
}

.sidebar-brand {
  margin-top: 14px;
  font-size: 2rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: rgba(255,255,255,0.94);
}

.sidebar-actions {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebar-action-row {
  width: 100%;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: rgba(255,255,255,0.88);
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 10px;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
}

.sidebar-action-row:hover {
  background: rgba(255,255,255,0.06);
}

.sidebar-action-row--muted {
  color: rgba(255,255,255,0.74);
}

.sidebar-action-icon {
  width: 28px;
  text-align: center;
  font-size: 1.2rem;
}

.sidebar-user-card {
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
}

.sidebar-user-label {
  font-size: 0.78rem;
  color: rgba(255,255,255,0.54);
}

.sidebar-user-name {
  margin-top: 6px;
  font-size: 0.98rem;
  color: rgba(255,255,255,0.92);
}

.sidebar-section {
  margin-top: 28px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.sidebar-section-title {
  margin-bottom: 14px;
  font-size: 0.9rem;
  font-weight: 700;
  color: rgba(255,255,255,0.94);
}

.sidebar-conversation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
}

.sidebar-conversation-item {
  display: flex;
  align-items: stretch;
  border-radius: 22px;
  overflow: hidden;
  background: transparent;
}

.sidebar-conversation-item.active {
  background: rgba(48, 79, 139, 0.82);
}

.sidebar-conversation-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.sidebar-conversation-switch {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 15px 18px;
}

.sidebar-conversation-input {
  width: 100%;
  margin: 10px 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(99,102,241,0.42);
  background: rgba(12,12,16,0.78);
  color: rgba(255,255,255,0.94);
  font-size: 0.92rem;
  outline: none;
}

.sidebar-conversation-name,
.sidebar-conversation-time {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-conversation-name {
  font-size: 0.98rem;
  color: rgba(255,255,255,0.94);
}

.sidebar-conversation-time {
  margin-top: 6px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6);
}

.sidebar-conversation-edit,
.sidebar-conversation-delete {
  width: 40px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.46);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-conversation-edit:hover,
.sidebar-conversation-delete:hover {
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.sidebar-footer {
  margin-top: 14px;
}

.workspace-main {
  flex: 1;
  min-width: 0;
  display: flex;
}

.divider {
  width: 4px;
  background: var(--bg-glass-border, rgba(255,255,255,0.08));
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.2s;
}
.divider:hover { background: var(--accent, #6366f1); }

.chat-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--bg-glass-border, rgba(255,255,255,0.08));
  flex-shrink: 0;
}
.chat-header-main {
  min-width: 0;
}
.chat-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-title { font-weight: 600; font-size: 0.95rem; }
.title-edit-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  background: rgba(255,255,255,0.04);
  color: var(--text-secondary, #888);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.title-edit-btn:hover {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary, #e8e8f0);
}
.chat-subtitle {
  margin-top: 4px;
  color: var(--text-secondary, #888);
  font-size: 0.8rem;
}
.header-actions { display: flex; gap: 6px; }
.icon-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-secondary, #888); padding: 5px; border-radius: 6px;
  display: flex; align-items: center;
}
.icon-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-primary, #e8e8f0); }
.icon-btn--active {
  background: rgba(99,102,241,0.18);
  color: var(--accent, #a5b4fc);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.empty-hint { text-align: center; color: var(--text-secondary, #888); margin-top: 60px; font-size: 0.9rem; }

.message { display: flex; gap: 10px; }
.message.user { flex-direction: row-reverse; }

.msg-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--bg-card, rgba(255,255,255,0.06));
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 600; flex-shrink: 0;
  color: var(--accent, #6366f1);
}
.message.user .msg-avatar { background: var(--accent, #6366f1); color: #fff; }

.msg-body { display: flex; flex-direction: column; gap: 6px; width: 90%; }
.message.user .msg-body { align-items: flex-end; }

.user-bubble {
  background: var(--accent, #6366f1);
  color: #fff;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 100%;
  word-break: break-word;
}

/* VMarkdownView 在紫色气泡内：强制浅色字，避免 dark 主题与背景冲突 */
.user-bubble--md :deep(.markdown-body) {
  color: #fff !important;
  background: transparent !important;
}
.user-bubble--md :deep(.markdown-body a) {
  color: #ede9fe !important;
}
.user-bubble--md :deep(.markdown-body code) {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
}
.user-bubble--md :deep(.markdown-body pre) {
  background: rgba(0, 0, 0, 0.22) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.agentDo-live-shell {
  width: 100%;
  padding: 14px 14px 12px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.22), transparent 38%),
    linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 18px 50px rgba(0,0,0,0.2);
}

.agentDo-live-header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.agentDo-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.15);
  color: #c7d2fe;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.agentDo-live-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #818cf8;
  box-shadow: 0 0 0 6px rgba(129, 140, 248, 0.14);
  animation: agentDoPulse 1.8s infinite;
}

.agentDo-live-heading {
  min-width: 0;
}

.agentDo-live-title {
  font-size: 1rem;
  font-weight: 700;
  color: rgba(255,255,255,0.96);
  line-height: 1.35;
}

.agentDo-live-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.56);
  word-break: break-word;
}

.agentDo-live-section + .agentDo-live-section {
  margin-top: 14px;
}

.agentDo-event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agentDo-event-item {
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03);
  overflow: hidden;
}

.agentDo-event-item.state-running {
  border-color: rgba(250,204,21,0.16);
  background: rgba(250,204,21,0.05);
}

.agentDo-event-item.state-completed {
  border-color: rgba(74,222,128,0.12);
}

.agentDo-event-item.state-error {
  border-color: rgba(248,113,113,0.18);
  background: rgba(239,68,68,0.05);
}

.agentDo-event-summary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  background: transparent;
  color: inherit;
  border: none;
  cursor: pointer;
  text-align: left;
}

.agentDo-event-summary:hover {
  background: rgba(255,255,255,0.03);
}

.agentDo-event-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.agentDo-event-icon {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.06);
  font-size: 0.84rem;
  flex-shrink: 0;
}

.agentDo-event-copy {
  min-width: 0;
}

.agentDo-event-title {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.96);
  line-height: 1.4;
}

.agentDo-event-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.56);
  line-height: 1.45;
  word-break: break-word;
}

.agentDo-event-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.agentDo-event-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.76);
}

.agentDo-event-badge.badge-running,
.agentDo-event-badge.badge-pending {
  color: #fde68a;
  background: rgba(250,204,21,0.1);
}

.agentDo-event-badge.badge-completed {
  color: #bbf7d0;
  background: rgba(34,197,94,0.12);
}

.agentDo-event-badge.badge-error {
  color: #fecaca;
  background: rgba(239,68,68,0.12);
}

.agentDo-event-detail {
  padding: 0 12px 12px 44px;
}

.agentDo-live-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.agentDo-live-footer-text {
  font-size: 0.76rem;
  color: rgba(255,255,255,0.46);
}

.agentDo-expand-all {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.74);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 0.74rem;
  cursor: pointer;
}

.agentDo-expand-all:hover {
  background: rgba(255,255,255,0.08);
}

.agentDo-result-inline {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.62);
}

.agentDo-result-inline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 6px rgba(74,222,128,0.12);
}

.agentDo-result-inline-link {
  color: #bbf7d0;
  text-decoration: none;
  word-break: break-all;
}

.agentDo-section-label {
  margin-bottom: 8px;
  font-size: 0.74rem;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agentDo-step-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agentDo-step-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.agentDo-step-marker {
  width: 16px;
  display: flex;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.agentDo-step-item:not(:last-child) .agentDo-step-marker::after {
  content: '';
  position: absolute;
  top: 16px;
  bottom: -14px;
  width: 1px;
  background: rgba(255,255,255,0.12);
}

.agentDo-step-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 6px;
  background: rgba(255,255,255,0.4);
}

.agentDo-step-item.is-current .agentDo-step-dot {
  background: #facc15;
  box-shadow: 0 0 0 7px rgba(250, 204, 21, 0.12);
}

.agentDo-step-content {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.06);
}

.agentDo-step-stage {
  font-size: 0.72rem;
  color: #a5b4fc;
  margin-bottom: 4px;
}

.agentDo-step-text {
  font-size: 0.9rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.92);
}

.agentDo-tool-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.agentDo-tool-card {
  padding: 12px 13px;
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
}

.agentDo-tool-card.is-running {
  border-color: rgba(96, 165, 250, 0.28);
  background: rgba(59, 130, 246, 0.08);
}

.agentDo-tool-card.is-error {
  border-color: rgba(248, 113, 113, 0.28);
  background: rgba(239, 68, 68, 0.08);
}

.agentDo-tool-head {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
}

.agentDo-tool-head-main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.agentDo-tool-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.agentDo-tool-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.92);
  font-size: 0.9rem;
}

.agentDo-tool-title {
  font-size: 0.86rem;
  font-weight: 600;
  color: rgba(255,255,255,0.95);
}

.agentDo-tool-meta {
  margin-top: 4px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.73rem;
  color: rgba(255,255,255,0.5);
}

.agentDo-tool-state {
  flex-shrink: 0;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid transparent;
}

.agentDo-tool-state.state-running,
.agentDo-tool-state.state-pending {
  color: #bfdbfe;
  background: rgba(59,130,246,0.13);
  border-color: rgba(96,165,250,0.18);
}

.agentDo-tool-state.state-completed {
  color: #bbf7d0;
  background: rgba(34,197,94,0.12);
  border-color: rgba(74,222,128,0.18);
}

.agentDo-tool-state.state-error {
  color: #fecaca;
  background: rgba(239,68,68,0.12);
  border-color: rgba(248,113,113,0.18);
}

.agentDo-tool-body {
  margin-top: 8px;
  font-size: 0.8rem;
  line-height: 1.55;
  color: rgba(255,255,255,0.68);
  word-break: break-word;
}

.agentDo-tool-toggle {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.72);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 0.74rem;
  cursor: pointer;
}

.agentDo-tool-toggle:hover {
  background: rgba(255,255,255,0.08);
}

.agentDo-tool-detail {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agentDo-tool-detail-block {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.18);
}

.agentDo-tool-detail-block.is-error {
  border-color: rgba(248,113,113,0.22);
}

.agentDo-tool-detail-label {
  padding: 8px 10px;
  font-size: 0.73rem;
  font-weight: 700;
  color: rgba(255,255,255,0.52);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.agentDo-tool-detail-block pre {
  margin: 0;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow: auto;
  font-size: 0.76rem;
  line-height: 1.5;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  color: rgba(255,255,255,0.82);
}

.agentDo-todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agentDo-todo-item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.06);
}

.agentDo-todo-check {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(255,255,255,0.3);
}

.agentDo-todo-check.todo-completed {
  background: #4ade80;
}

.agentDo-todo-check.todo-in_progress {
  background: #facc15;
}

.agentDo-todo-text {
  font-size: 0.86rem;
  color: rgba(255,255,255,0.9);
  line-height: 1.45;
}

.agentDo-note-card,
.agentDo-output-card {
  padding: 12px 13px;
  border-radius: 16px;
  background: rgba(255,255,255,0.035);
  border: 1px solid rgba(255,255,255,0.06);
}

.agentDo-note-card {
  color: rgba(255,255,255,0.74);
  line-height: 1.7;
  white-space: pre-wrap;
}

.agentDo-output-card :deep(.markdown-body) {
  background: transparent !important;
}

.agentDo-result-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.06));
  border: 1px solid rgba(74,222,128,0.16);
}

.agentDo-result-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #dcfce7;
}

.agentDo-result-url {
  margin-top: 5px;
  font-size: 0.76rem;
  line-height: 1.55;
  color: rgba(220,252,231,0.78);
  word-break: break-all;
}

.agentDo-result-link {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: #ecfdf5;
  background: rgba(16,185,129,0.16);
  border: 1px solid rgba(52,211,153,0.2);
}

.agent-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-primary, #e8e8f0);
  padding: 2px 0;
}

.agent-friendly {
  font-size: 0.92rem;
  line-height: 1.65;
  color: var(--text-primary, #e8e8f0);
  padding: 4px 0 10px;
  border-bottom: 1px solid var(--bg-glass-border, rgba(255, 255, 255, 0.06));
  margin-bottom: 8px;
}

/* 流式 HTML：加宽、压低高度（约一屏内短条预览），与图中红框比例接近 */
.stream-code-shell {
  width: 100%;
  max-width: 100%;
  margin-top: 4px;
  border-radius: 10px;
  border: 1px solid var(--bg-glass-border, rgba(255, 255, 255, 0.1));
  background: rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.stream-code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--bg-glass-border, rgba(255, 255, 255, 0.08));
  background: rgba(255, 255, 255, 0.03);
}

.stream-code-header--static {
  margin-bottom: 0;
  border-radius: 10px 10px 0 0;
}

.stream-code-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary, #a1a1b0);
}

.stream-code-copy {
  flex-shrink: 0;
  font-size: 0.75rem;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.stream-code-copy:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.22);
  color: #e0e7ff;
}
.stream-code-copy:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.agent-text--stream {
  width: 100%;
  max-width: 100%;
  max-height: clamp(132px, 26vh, 210px);
  overflow: auto;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.78rem;
  line-height: 1.45;
  background: rgba(0, 0, 0, 0.35);
  border: none;
  border-radius: 0;
  padding: 10px 12px;
  word-break: break-word;
}

/* 生成结束后仍展示源码：与流式区同宽，同样压低高度 */
.agent-html-source {
  width: 100%;
  max-width: 100%;
  margin-top: 10px;
  border-radius: 10px;
  border: 1px solid var(--bg-glass-border, rgba(255, 255, 255, 0.1));
  overflow: hidden;
  background: rgba(0, 0, 0, 0.22);
}
.agent-html-source-pre {
  margin: 0;
  padding: 10px 12px;
  max-height: clamp(132px, 26vh, 210px);
  overflow: auto;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.76rem;
  line-height: 1.45;
  background: rgba(0, 0, 0, 0.35);
  border: none;
  border-radius: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.msg-time { font-size: 0.72rem; color: var(--text-secondary, #888); margin-top: 2px; }

.agent-card {
  border-radius: 10px;
  border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.08));
  background: var(--bg-card, rgba(255,255,255,0.04));
  overflow: hidden;
  width: 100%;
}

.agent-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
  user-select: none;
  font-size: 0.85rem;
  font-weight: 500;
}
.agent-card-header:hover { background: rgba(255,255,255,0.04); }

.card-icon { font-size: 0.95rem; }
.card-title-text { flex: 1; }

.chevron { transition: transform 0.2s; flex-shrink: 0; }
.chevron.open { transform: rotate(180deg); }

.agent-card-body {
  padding: 10px 14px 12px;
  border-top: 1px solid var(--bg-glass-border, rgba(255,255,255,0.06));
  font-size: 0.83rem;
  line-height: 1.6;
  color: var(--text-secondary, #aaa);
}

.bash-block {
  margin: 0; padding: 10px 12px;
  background: rgba(0,0,0,0.3);
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.card-thinking .agent-card-header { color: #fbbf24; }
.card-plan     .agent-card-header { color: #a78bfa; }
.card-bash     .agent-card-header { color: #34d399; }
.card-read     .agent-card-header { color: #fb923c; }
.card-search   .agent-card-header { color: #818cf8; }
.card-skill    .agent-card-header { color: #f472b6; }

.typing-dots { display: flex; gap: 5px; padding: 8px 4px; }
.typing-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--text-secondary, #888);
  animation: bounce 1.2s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--bg-glass-border, rgba(255,255,255,0.08));
  flex-shrink: 0;
}

.input-area textarea {
  flex: 1;
  background: var(--bg-card, rgba(255,255,255,0.06));
  border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.1));
  border-radius: 10px;
  color: var(--text-primary, #e8e8f0);
  padding: 9px 12px;
  font-size: 0.9rem;
  resize: none;
  outline: none;
  line-height: 1.5;
  min-height: 38px;
  font-family: inherit;
}
.input-area textarea:focus { border-color: var(--accent, #6366f1); }
.input-area textarea::placeholder { color: var(--text-secondary, #666); }

.send-btn, .mic-btn {
  width: 36px; height: 36px; border-radius: 9px; border: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s;
}
.send-btn { background: var(--accent, #6366f1); color: #fff; }
.send-btn:hover:not(:disabled) { background: #4f46e5; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mic-btn {
  background: var(--bg-card, rgba(255,255,255,0.06));
  color: var(--text-secondary, #888);
  border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.1));
}
.mic-btn:hover { color: var(--text-primary, #e8e8f0); }
.mic-btn.recording { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }

.results-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--bg-glass-border, rgba(255,255,255,0.08));
  flex-shrink: 0;
}
.results-title { font-weight: 600; font-size: 0.95rem; }
.mode-tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(99,102,241,0.15);
  color: var(--accent, #6366f1);
  border: 1px solid rgba(99,102,241,0.25);
}

.results-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  min-height: 0;
  min-width: 0;
}

.results-content--with-files {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)),
    rgba(0,0,0,0.08);
}

.workspace-browser {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.08);
  background: rgba(10,10,14,0.72);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workspace-browser-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.workspace-browser-title {
  font-size: 0.92rem;
  font-weight: 700;
}

.workspace-browser-subtitle {
  margin-top: 4px;
  font-size: 0.76rem;
  color: rgba(255,255,255,0.56);
  line-height: 1.45;
}

.workspace-refresh-btn {
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.88);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.78rem;
  cursor: pointer;
  flex-shrink: 0;
}

.workspace-refresh-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.workspace-browser-error,
.file-viewer-error {
  margin: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  color: #fecaca;
  background: rgba(127,29,29,0.35);
  border: 1px solid rgba(248,113,113,0.2);
  font-size: 0.84rem;
}

.workspace-browser-empty,
.file-viewer-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: rgba(255,255,255,0.54);
  font-size: 0.84rem;
  text-align: center;
}

.workspace-tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 0 14px;
}

.workspace-tree-node {
  width: 100%;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.86);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.16s ease, color 0.16s ease;
}

.workspace-tree-node:hover {
  background: rgba(255,255,255,0.05);
}

.workspace-tree-node.is-selected {
  background: rgba(99,102,241,0.16);
  color: rgba(255,255,255,0.98);
}

.workspace-tree-caret {
  width: 12px;
  min-width: 12px;
  color: rgba(255,255,255,0.46);
}

.workspace-tree-caret svg {
  transition: transform 0.16s ease;
}

.workspace-tree-caret svg.open {
  transform: rotate(90deg);
}

.workspace-tree-icon {
  width: 18px;
  min-width: 18px;
}

.workspace-tree-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
}

.results-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.results-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  flex-shrink: 0;
}

.results-tab {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.7);
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 0.82rem;
  cursor: pointer;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.results-tab.active {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.09);
  border-color: rgba(255,255,255,0.16);
}

.file-viewer {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.file-viewer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.file-viewer-title {
  font-size: 0.96rem;
  font-weight: 700;
  color: rgba(255,255,255,0.94);
}

.file-viewer-subtitle {
  margin-top: 4px;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.54);
  word-break: break-word;
}

.file-viewer-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: rgba(8,8,12,0.78);
}

.file-viewer-notice {
  margin: 12px 12px 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(250,204,21,0.1);
  border: 1px solid rgba(250,204,21,0.18);
  color: #fde68a;
  font-size: 0.78rem;
}

.file-viewer-code {
  margin: 0;
  padding: 18px;
  white-space: pre;
  overflow: auto;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.58;
  color: #d8e5f2;
}

.debug-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

/* [容器池功能暂时禁用]
.sandbox-pool-panel {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.sandbox-pool-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.sandbox-pool-title {
  font-size: 0.92rem;
  font-weight: 600;
}

.sandbox-pool-subtitle {
  margin-top: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary, #a1a1b0);
}

.sandbox-pool-refresh {
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.88);
  border-radius: 10px;
  padding: 7px 12px;
  font-size: 0.8rem;
  cursor: pointer;
}

.sandbox-pool-refresh:disabled {
  opacity: 0.55;
  cursor: default;
}

.sandbox-pool-error {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  color: #fecaca;
  background: rgba(127,29,29,0.35);
  border: 1px solid rgba(248,113,113,0.2);
  font-size: 0.84rem;
}

.sandbox-pool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sandbox-pool-card {
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  overflow: hidden;
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.sandbox-pool-card-title {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: var(--text-secondary, #a1a1b0);
  font-size: 0.8rem;
  font-weight: 600;
}

.sandbox-pool-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.sandbox-pool-item {
  padding: 11px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.16);
  border: 1px solid rgba(255,255,255,0.06);
}

.sandbox-pool-item-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  word-break: break-word;
}

.sandbox-pool-item-meta {
  margin-top: 4px;
  font-size: 0.76rem;
  color: rgba(255,255,255,0.58);
  word-break: break-word;
}

.sandbox-pool-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: rgba(255,255,255,0.52);
  font-size: 0.84rem;
}
*/

.debug-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.debug-panel-title {
  font-size: 0.92rem;
  font-weight: 600;
}

.debug-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.debug-item {
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  overflow: hidden;
}

.debug-label {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  color: var(--text-secondary, #a1a1b0);
  font-size: 0.8rem;
  font-weight: 600;
}

.debug-value {
  margin: 0;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: ui-monospace, 'Cascadia Code', 'Consolas', monospace;
  font-size: 0.78rem;
  line-height: 1.55;
  color: var(--text-primary, #e8e8f0);
  background: rgba(0,0,0,0.18);
  max-height: 240px;
  overflow: auto;
}

.results-empty {
  flex: 1;
  display: flex;
  padding: 22px;
  align-items: stretch;
  justify-content: center;
}

.preview-waiting-shell {
  width: min(560px, 100%);
  margin: 0 auto;
  padding: 28px 26px;
  border-radius: 28px;
  text-align: center;
  color: rgba(255,255,255,0.75);
  background:
    radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 45%),
    linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  position: relative;
  overflow: hidden;
}

.preview-waiting-shell.is-busy::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px);
  background-size: 18px 18px;
  opacity: 0.22;
  pointer-events: none;
}

.preview-waiting-orb {
  width: 92px;
  height: 92px;
  margin: 0 auto 18px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.82);
  background: rgba(255,255,255,0.04);
  position: relative;
}

.preview-waiting-ring {
  position: absolute;
  inset: 10px;
  border-radius: 22px;
  border: 1px solid rgba(129,140,248,0.3);
}

.preview-waiting-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: rgba(255,255,255,0.96);
}

.preview-waiting-text {
  margin: 10px auto 0;
  max-width: 420px;
  line-height: 1.65;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.62);
}

.preview-waiting-tips {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-waiting-tips span {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  color: #d1d5db;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.04);
}

.preview-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: block;
  border: none;
  background: #fff;
}

.code-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}
.code-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--bg-glass-border, rgba(255,255,255,0.08));
  flex-shrink: 0;
}
.code-lang-tag { font-size: 0.78rem; color: var(--text-secondary, #888); font-family: monospace; }
.copy-btn {
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 5px;
  border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.1));
  background: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
  transition: all 0.15s;
}
.copy-btn:hover { color: var(--text-primary, #e8e8f0); }
.copy-btn.copied { color: #34d399; border-color: rgba(52,211,153,0.3); }

.url-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  min-width: 0;
}

.preview-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
}

.preview-status-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.preview-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(255,255,255,0.35);
}

.preview-status-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: rgba(255,255,255,0.94);
}

.preview-status-subtitle {
  margin-top: 3px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.56);
}

.preview-status-chip {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.8);
}

.preview-status-bar.status-waiting .preview-status-dot,
.preview-status-bar.status-loading .preview-status-dot {
  background: #facc15;
  box-shadow: 0 0 0 6px rgba(250,204,21,0.12);
}

.preview-status-bar.status-ready .preview-status-dot {
  background: #4ade80;
  box-shadow: 0 0 0 6px rgba(74,222,128,0.12);
}

.preview-status-bar.status-error .preview-status-dot {
  background: #f87171;
  box-shadow: 0 0 0 6px rgba(248,113,113,0.12);
}

.url-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--bg-glass-border, rgba(255,255,255,0.08));
  flex-shrink: 0;
  color: var(--text-secondary, #888);
  font-size: 0.82rem;
}

.url-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.url-open-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--accent, #6366f1);
  text-decoration: none;
  font-size: 0.78rem;
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 5px;
  border: 1px solid rgba(99,102,241,0.25);
  transition: background 0.15s;
}
.url-open-btn:hover { background: rgba(99,102,241,0.1); }

.url-fallback {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary, #888);
  font-size: 0.9rem;
}

.fallback-link {
  color: var(--accent, #6366f1);
  text-decoration: none;
  font-size: 0.88rem;
}
.fallback-link:hover { text-decoration: underline; }

@keyframes agentDoPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.8;
  }
}

/* ── Stream status bar (sticky top) ───────────────────────── */
.stream-status-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 16px;
  margin: -16px -16px 12px;
  background: linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(15,15,19,0.95) 60%);
  border-bottom: 1px solid rgba(99,102,241,0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.stream-status-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
  max-width: 40%;
}

.stream-status-dot-anim {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #818cf8;
  flex-shrink: 0;
  animation: statusPulse 1.5s ease-in-out infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.stream-status-phase {
  font-size: 0.78rem;
  font-weight: 600;
  color: #c7d2fe;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stream-status-center {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.stream-status-steps {
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
  flex-shrink: 0;
}

.stream-status-progress-track {
  flex: 1;
  height: 4px;
  border-radius: 4px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
  min-width: 40px;
}

.stream-status-progress-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #4f46e5, #818cf8);
  transition: width 0.4s ease;
}

.stream-status-right {
  flex-shrink: 0;
}

.stream-status-elapsed {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(255,255,255,0.5);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
}

/* ── Scroll to bottom button ─────────────────────────────── */
.scroll-to-bottom-btn {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid rgba(99,102,241,0.4);
  border-radius: 999px;
  background: rgba(25,25,35,0.92);
  color: #c7d2fe;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}

.scroll-to-bottom-btn:hover {
  background: rgba(79,70,229,0.6);
  box-shadow: 0 6px 28px rgba(79,70,229,0.35);
  transform: translateX(-50%) translateY(-2px);
}

.scroll-btn-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(99,102,241,0.5);
  font-size: 0.68rem;
  color: #e0e7ff;
  font-weight: 700;
}

.scroll-btn-enter-active,
.scroll-btn-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.scroll-btn-enter-from,
.scroll-btn-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

/* ── Agent-Do timer in header ────────────────────────────── */
.agentDo-live-timer {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(99,102,241,0.15);
  border: 1px solid rgba(129,140,248,0.25);
  font-size: 0.75rem;
  font-weight: 700;
  color: #a5b4fc;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.agentDo-live-timer svg {
  opacity: 0.7;
}

/* ── Agent-Do progress bar ───────────────────────────────── */
.agentDo-progress-bar {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(129,140,248,0.15);
}

.agentDo-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 7px;
}

.agentDo-progress-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: #a5b4fc;
}

.agentDo-progress-detail {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.45);
  font-variant-numeric: tabular-nums;
}

.agentDo-progress-track {
  height: 6px;
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  overflow: hidden;
}

.agentDo-progress-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #4f46e5, #818cf8, #a78bfa);
  transition: width 0.5s ease;
  position: relative;
}

.agentDo-progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
  animation: progressShine 2s ease-in-out infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.code-preview-body {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 16px;
  font-family: monospace;
  font-size: 0.82rem;
  line-height: 1.65;
  color: #c9d1d9;
  background: rgba(0,0,0,0.2);
  white-space: pre;
}

@media (max-width: 900px) {
  .history-sidebar.expanded {
    width: 270px;
  }
}

@media (max-width: 768px) {
  .history-sidebar {
    width: 64px;
    padding: 12px 10px 14px;
  }

  .history-sidebar.expanded {
    width: 248px;
    padding: 12px 14px 14px;
  }

  .sidebar-brand {
    font-size: 1.55rem;
  }

  .agentDo-live-header,
  .agentDo-result-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-waiting-shell {
    padding: 24px 18px;
    border-radius: 22px;
  }

  /* [容器池功能暂时禁用]
  .sandbox-pool-grid {
    grid-template-columns: 1fr;
  }
  */
}
</style>
