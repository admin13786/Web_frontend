<template>
  <div
    class="workshop"
    :class="[
      theme === 'dark' ? 'workshop--dark' : 'workshop--light',
      {
        'is-mobile': isMobile,
        'mobile-sidebar-open': mobileSidebarOpen,
      },
    ]"
    ref="workshopEl"
  >
    <aside
      v-if="isMobile"
      class="history-sidebar"
      :class="{
        'is-mobile-open': mobileSidebarOpen,
      }"
    >
      <div class="sidebar-top">
        <button type="button" class="sidebar-icon-btn" title="收起侧栏" @click="toggleSidebar">
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

      <template>
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
              v-for="item in pagedConversationList"
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
                @click="requestDeleteConversation(item.id)"
              >
                ×
              </button>
            </div>
            <div v-if="!pagedConversationList.length" class="sidebar-conversation-empty">
              暂无最近对话
            </div>
          </div>
          <div v-if="totalConversationPages > 1" class="sidebar-conversation-pagination">
            <button
              type="button"
              class="sidebar-page-btn"
              :disabled="conversationPage === 0"
              @click="goToPreviousConversationPage"
            >
              上一页
            </button>
            <span class="sidebar-page-indicator">{{ conversationPage + 1 }} / {{ totalConversationPages }}</span>
            <button
              type="button"
              class="sidebar-page-btn"
              :disabled="conversationPage >= totalConversationPages - 1"
              @click="goToNextConversationPage"
            >
              下一页
            </button>
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

    <div
      v-if="isMobile && mobileSidebarOpen"
      class="mobile-sidebar-mask"
      @click="mobileSidebarOpen = false"
    ></div>

    <div v-if="isWelcomeScreen" class="workspace-main">
      <div class="chat-panel chat-panel--welcome">
        <div class="welcome-screen">
          <div class="welcome-screen__panel">
            <div class="welcome-screen__meta">
              <div class="welcome-screen__title-row">
                <button
                  v-if="isMobile"
                  type="button"
                  class="icon-btn welcome-screen__menu-btn"
                  title="打开对话侧栏"
                  @click="toggleSidebar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                </button>
                <div class="welcome-screen__title">{{ chatTitle }}</div>
              </div>
              <div class="welcome-screen__subtitle">当前用户 · {{ userDisplayName }}</div>
            </div>

            <div class="welcome-screen__hero">
              <div class="welcome-screen__art"></div>
              <div class="welcome-screen__copy">
                <span class="welcome-screen__eyebrow">Agent Workspace</span>
                <h1 class="welcome-screen__headline">Hi, 朋友</h1>
                <p class="welcome-screen__desc">今天想一起完成什么？可以直接输入需求，我们马上开始。</p>
              </div>
            </div>

            <div class="welcome-screen__composer">
              <textarea
                v-model="inputText"
                class="welcome-screen__textarea"
                placeholder="给我一个任务，或者直接描述你想要的页面"
                rows="1"
                @keydown.enter.exact.prevent="sendMessage"
                @input="autoResize"
                ref="textareaEl"
              ></textarea>
              <div
                v-if="isSkillAssistantMode && (pendingAttachments.length || uploadedAttachments.length || attachmentUploadError)"
                class="skill-attachment-panel skill-attachment-panel--welcome"
              >
                <div v-if="attachmentUploadError" class="skill-attachment-panel__error">{{ attachmentUploadError }}</div>
                <div v-if="pendingAttachments.length" class="skill-attachment-group">
                  <div class="skill-attachment-group__title">待上传附件</div>
                  <div class="skill-attachment-list">
                    <div
                      v-for="item in pendingAttachments"
                      :key="item.id"
                      class="skill-attachment-chip skill-attachment-chip--pending"
                    >
                      <div class="skill-attachment-chip__main">
                        <span class="skill-attachment-chip__name">{{ item.name }}</span>
                        <span class="skill-attachment-chip__meta">{{ formatAttachmentSize(item.size) }} · 待发送</span>
                      </div>
                      <button
                        type="button"
                        class="skill-attachment-chip__remove"
                        title="移除待上传附件"
                        @click="removePendingAttachment(item.id)"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="uploadedAttachments.length" class="skill-attachment-group">
                  <div class="skill-attachment-group__title">已上传附件</div>
                  <div class="skill-attachment-list">
                    <div
                      v-for="item in uploadedAttachments"
                      :key="item.id"
                      class="skill-attachment-chip"
                      :class="attachmentStatusClass(item)"
                    >
                      <div class="skill-attachment-chip__main">
                        <span class="skill-attachment-chip__name">{{ item.originalName }}</span>
                        <span class="skill-attachment-chip__meta">
                          {{ formatAttachmentSize(item.size) }} · {{ attachmentStatusText(item) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="welcome-screen__actions">
                <button
                  v-if="isSkillAssistantMode"
                  type="button"
                  class="attachment-btn attachment-btn--welcome"
                  :disabled="busy || attachmentUploading"
                  @click="openAttachmentPicker"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l9.19-9.2a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.48-8.48"/>
                  </svg>
                  <span>{{ attachmentUploading ? '上传中...' : '上传文件' }}</span>
                </button>
                <div
                  v-if="!isSkillAssistantMode"
                  class="mode-switch mode-switch--welcome"
                  role="tablist"
                  aria-label="生成模式"
                >
                  <button
                    type="button"
                    class="mode-switch__option"
                    :class="{ 'mode-switch__option--active': generationMode === 'single_html' }"
                    title="使用单个 HTML 文件生成"
                    @click="setGenerationMode('single_html')"
                  >
                    <span class="mode-switch__label">HTML</span>
                    <span class="mode-switch__hint">单文件</span>
                  </button>
                  <button
                    type="button"
                    class="mode-switch__option"
                    :class="{ 'mode-switch__option--active': generationMode === 'vite' }"
                    title="使用 Vite 多文件工程生成"
                    @click="setGenerationMode('vite')"
                  >
                    <span class="mode-switch__label">Vite</span>
                    <span class="mode-switch__hint">多文件</span>
                  </button>
                </div>
                <button class="welcome-screen__send" :disabled="!canSendCurrentMessage" @click="sendMessage">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="workspace-main">
    <div v-if="isMobile" class="mobile-pane-switch">
      <button
        type="button"
        class="mobile-pane-switch__btn"
        :class="{ active: mobilePane === 'chat' }"
        @click="mobilePane = 'chat'"
      >
        对话
      </button>
      <button
        v-if="showResultPanel"
        type="button"
        class="mobile-pane-switch__btn"
        :class="{ active: mobilePane === 'result' }"
        @click="mobilePane = 'result'"
      >
        结果
      </button>
    </div>
    <!-- Left: Chat Panel -->
    <div
      v-show="!isMobile || !showResultPanel || mobilePane === 'chat'"
      class="chat-panel"
      :style="isMobile ? undefined : (showResultPanel ? { width: leftWidth + '%' } : { width: '100%' })"
    >
      <div class="chat-header">
        <div class="chat-header-main">
          <div>
            <div class="chat-title-row">
              <template v-if="editingConversationId === currentConversationId">
                <input
                  :id="conversationInputId(currentConversationId)"
                  v-model="editingTitle"
                  type="text"
                  class="chat-title-input"
                  maxlength="40"
                  @keydown.enter.prevent="commitRename(currentConversationId)"
                  @keydown.esc.prevent="cancelRename"
                  @blur="commitRename(currentConversationId)"
                />
              </template>
              <div v-else class="chat-title">{{ chatTitle }}</div>
              <button
                v-if="editingConversationId !== currentConversationId"
                type="button"
                class="title-edit-btn"
                title="修改对话名"
                @click="startRename(currentConversationId)"
              >
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
          <button
            class="icon-btn"
            :class="{ 'icon-btn--active': showWorkspaceFiles }"
            title="打开文件目录"
            @click="toggleWorkspaceFiles"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </button>
          <button
            class="icon-btn"
            :title="isMobile ? '打开对话侧栏' : '历史侧栏仅在移动端显示'"
            @click="toggleSidebar"
          >
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
                      <MarkdownView :content="seg.content" :mode="markdownMode" />
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
                    <MarkdownView :content="seg.content" :mode="markdownMode" />
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
                      <MarkdownView v-else :content="seg.content" :mode="markdownMode" />
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
        <button
          v-if="isSkillAssistantMode"
          type="button"
          class="attachment-btn"
          :disabled="busy || attachmentUploading"
          @click="openAttachmentPicker"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-8.49 8.49a5 5 0 0 1-7.07-7.07l9.19-9.2a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.48-8.48"/>
          </svg>
          <span>{{ attachmentUploading ? '上传中...' : '上传文件' }}</span>
        </button>
        <div v-if="!isSkillAssistantMode" class="mode-switch" role="tablist" aria-label="生成模式">
          <button
            type="button"
            class="mode-switch__option"
            :class="{ 'mode-switch__option--active': generationMode === 'single_html' }"
            title="使用单个 HTML 文件生成"
            @click="setGenerationMode('single_html')"
          >
            <span class="mode-switch__label">HTML</span>
            <span class="mode-switch__hint">单文件</span>
          </button>
          <button
            type="button"
            class="mode-switch__option"
            :class="{ 'mode-switch__option--active': generationMode === 'vite' }"
            title="使用 Vite 多文件工程生成"
            @click="setGenerationMode('vite')"
          >
            <span class="mode-switch__label">Vite</span>
            <span class="mode-switch__hint">多文件</span>
          </button>
        </div>
        <button class="send-btn" :disabled="!canSendCurrentMessage" @click="sendMessage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <div
        v-if="isSkillAssistantMode && (pendingAttachments.length || uploadedAttachments.length || attachmentUploadError)"
        class="skill-attachment-panel skill-attachment-panel--chat"
      >
        <div v-if="attachmentUploadError" class="skill-attachment-panel__error">{{ attachmentUploadError }}</div>
        <div v-if="pendingAttachments.length" class="skill-attachment-group">
          <div class="skill-attachment-group__title">待上传附件</div>
          <div class="skill-attachment-list">
            <div
              v-for="item in pendingAttachments"
              :key="item.id"
              class="skill-attachment-chip skill-attachment-chip--pending"
            >
              <div class="skill-attachment-chip__main">
                <span class="skill-attachment-chip__name">{{ item.name }}</span>
                <span class="skill-attachment-chip__meta">{{ formatAttachmentSize(item.size) }} · 待发送</span>
              </div>
              <button
                type="button"
                class="skill-attachment-chip__remove"
                title="移除待上传附件"
                @click="removePendingAttachment(item.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
        <div v-if="uploadedAttachments.length" class="skill-attachment-group">
          <div class="skill-attachment-group__title">已上传附件</div>
          <div class="skill-attachment-list">
            <div
              v-for="item in uploadedAttachments"
              :key="item.id"
              class="skill-attachment-chip"
              :class="attachmentStatusClass(item)"
            >
              <div class="skill-attachment-chip__main">
                <span class="skill-attachment-chip__name">{{ item.originalName }}</span>
                <span class="skill-attachment-chip__meta">
                  {{ formatAttachmentSize(item.size) }} · {{ attachmentStatusText(item) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div v-if="!isMobile && showResultPanel" class="divider" @mousedown="startDrag"></div>

    <!-- Right: Preview Panel -->
    <div v-if="showResultPanel" v-show="!isMobile || mobilePane === 'result'" class="results-panel">
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
          <div v-if="showWorkspaceFiles && !isSkillAssistantMode" class="results-tabs">
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

          <div v-if="showWorkspaceFiles && (workspaceActiveView === 'file' || isSkillAssistantMode)" class="file-viewer">
            <div class="file-viewer-header">
              <div>
                <div class="file-viewer-title">{{ workspaceSelectedFile.name || '选择文件' }}</div>
                <div class="file-viewer-subtitle">{{ workspaceSelectedFile.path || '从左侧目录中选择一个文件查看内容。' }}</div>
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
            <div v-else class="file-viewer-empty">从左侧目录中选择一个文件查看内容。</div>
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
                  <div class="sandbox-pool-item-meta">{{ item.containerName }} / {{ item.kind }} / 端口 {{ item.port }}</div>
                  <div class="sandbox-pool-item-meta">最近访问：{{ formatPoolTime(item.lastAccessedAt) }}</div>
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
                  <div class="sandbox-pool-item-meta">回收于：{{ formatPoolTime(item.reclaimedAt) }}</div>
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
              <div class="debug-label">手动选择的 Skills</div>
              <pre class="debug-value"><code>{{ selectedSkillsText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">Skill Resolve 结果</div>
              <pre class="debug-value"><code>{{ skillResolutionText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">Skill 物化结果</div>
              <pre class="debug-value"><code>{{ skillMaterializationText }}</code></pre>
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
              <div class="debug-label">工具输入 / 输出</div>
              <pre class="debug-value"><code>{{ toolLogsText }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">文本增量</div>
              <pre class="debug-value"><code>{{ agentDoDebug.textDelta || '-' }}</code></pre>
            </div>
            <div class="debug-item">
              <div class="debug-label">Todo 列表</div>
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
              新标签页打开
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
    <DeleteConversationConfirmModal
      v-model:open="deleteConversationModalOpen"
      @confirm="confirmDeleteConversation"
      @cancel="onDeleteConversationModalCancel"
    />
    <input
      ref="attachmentInputEl"
      type="file"
      class="skill-attachment-input"
      :accept="SKILL_ATTACHMENT_ACCEPT"
      multiple
      @change="handleAttachmentInputChange"
    />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout as logoutApi } from '../api/auth.js'
import {
  ensureAgentDoSessionMapping,
  // fetchAgentDoSandboxPool, // [容器池功能暂时禁用]
  fetchAgentDoWorkspaceFile,
  fetchAgentDoWorkspaceTree,
  normalizeWorkshopPreviewUrl,
  restoreAgentDoSessionMapping,
  streamGenerateText,
  streamPreviewWithAgentDo,
  uploadSkillAssistantFiles,
  uploadHTML,
} from '../api/workshop.js'
import {
  deleteWorkshopConversationDeep,
  fetchWorkshopConversations,
  saveWorkshopConversation,
} from '../api/workshopConversations.js'
import WorkshopStreamProgress from '../components/WorkshopStreamProgress.vue'
import MarkdownView from '../components/MarkdownView.vue'
import DeleteConversationConfirmModal from '../components/DeleteConversationConfirmModal.vue'
import { useTheme } from '../composables/useTheme'
import { clearCurrentUser, getCurrentUser, getUserDisplayName } from '../utils/auth.js'
import { createEmptyConversation, removeWorkshopConversationState } from '../utils/workshopHistory.js'

const router = useRouter()
const route = useRoute()
const WORKSHOP_CREATE_CONVERSATION_EVENT = 'workshop-create-conversation'
const WORKSHOP_CONVERSATION_DELETED_EVENT = 'workshop-conversation-deleted'
const WORKSHOP_SKILL_SELECTED_EVENT = 'workshop-skill-selected'
const WORKSHOP_SKILL_STORAGE_KEY = 'workshop-selected-skills'
const SKILL_ATTACHMENT_ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.md', '.txt'])
const SKILL_ATTACHMENT_MAX_FILES = 5
const SKILL_ATTACHMENT_MAX_FILE_SIZE = 10 * 1024 * 1024
const SKILL_ATTACHMENT_MAX_TOTAL_SIZE = 25 * 1024 * 1024
const SKILL_ATTACHMENT_ACCEPT = '.pdf,.docx,.md,.txt'
const SKILL_ATTACHMENT_DEFAULT_PROMPT = '请先读取我刚上传的文件，概括重点，并告诉我接下来你能如何帮助我。'
const { theme } = useTheme()
const currentUser = ref(getCurrentUser())
const markdownMode = computed(() => (theme.value === 'light' ? 'light' : 'dark'))
const userDisplayName = computed(() => getUserDisplayName(currentUser.value) || '未登录')
const isMobile = ref(false)
const mobilePane = ref('chat')
const mobileSidebarOpen = ref(false)
const selectedSkillMetas = ref([])

function normalizeFunctionMode(mode) {
  return String(mode || '').trim() === 'skill_assistant' ? 'skill_assistant' : 'workshop'
}

const currentFunctionMode = computed(() => normalizeFunctionMode(route.query.fm))
const isSkillAssistantMode = computed(() => currentFunctionMode.value === 'skill_assistant')
const selectedSkillIds = computed(() => selectedSkillMetas.value.map((item) => item.id).filter(Boolean))
const attachmentInputEl = ref(null)
const pendingAttachments = ref([])
const uploadedAttachments = ref([])
const attachmentUploading = ref(false)
const attachmentUploadError = ref('')
let attachmentSelectionSeq = 0

function loadStoredSkillSelection() {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(WORKSHOP_SKILL_STORAGE_KEY)
  if (!raw) {
    selectedSkillMetas.value = []
    return
  }
  try {
    const parsed = JSON.parse(raw)
    const list = Array.isArray(parsed?.skills) ? parsed.skills : []
    selectedSkillMetas.value = list
      .map((item) => ({
        id: String(item?.id || '').trim(),
        name: String(item?.name || '').trim(),
        version: String(item?.version || '').trim(),
      }))
      .filter((item) => item.id)
  } catch {
    selectedSkillMetas.value = []
  }
}

function handleSkillSelectionChanged(event) {
  const list = Array.isArray(event?.detail?.skills) ? event.detail.skills : []
  selectedSkillMetas.value = list
    .map((item) => ({
      id: String(item?.id || '').trim(),
      name: String(item?.name || '').trim(),
      version: String(item?.version || '').trim(),
    }))
    .filter((item) => item.id)
}

function getAttachmentExtension(name) {
  const normalized = String(name || '').trim().toLowerCase()
  const dotIndex = normalized.lastIndexOf('.')
  return dotIndex >= 0 ? normalized.slice(dotIndex) : ''
}

function formatAttachmentSize(size) {
  const bytes = Number(size || 0)
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function normalizeUploadedAttachmentRecord(item) {
  return {
    id: String(item?.id || '').trim(),
    originalName: String(item?.originalName || '').trim() || String(item?.safeName || '').trim() || '未命名文件',
    safeName: String(item?.safeName || '').trim(),
    extension: String(item?.extension || '').trim().toLowerCase(),
    contentType: String(item?.contentType || '').trim(),
    size: Number(item?.size || 0),
    uploadedAt: String(item?.uploadedAt || '').trim(),
    originalPath: String(item?.originalPath || '').trim(),
    extractedPath: String(item?.extractedPath || '').trim(),
    extractionStatus: String(item?.extractionStatus || '').trim() || 'success',
    extractedChars: Number(item?.extractedChars || 0),
    error: String(item?.error || '').trim(),
  }
}

function mergeUploadedAttachmentRecords(existing, incoming) {
  const merged = []
  const byId = new Map()
  for (const source of [existing, incoming]) {
    const list = Array.isArray(source) ? source : []
    for (const item of list) {
      const normalized = normalizeUploadedAttachmentRecord(item)
      if (!normalized.id) continue
      byId.set(normalized.id, normalized)
    }
  }
  for (const item of byId.values()) {
    merged.push(item)
  }
  merged.sort((a, b) => String(a.uploadedAt || '').localeCompare(String(b.uploadedAt || '')))
  return merged
}

function attachmentStatusText(item) {
  const status = String(item?.extractionStatus || '').trim().toLowerCase()
  if (status === 'failed') return '提取失败'
  if (status === 'empty') return '已上传，提取为空'
  return '上传成功'
}

function attachmentStatusClass(item) {
  const status = String(item?.extractionStatus || '').trim().toLowerCase()
  if (status === 'failed') return 'skill-attachment-chip--failed'
  if (status === 'empty') return 'skill-attachment-chip--empty'
  return 'skill-attachment-chip--success'
}

function resetAttachmentInput() {
  if (attachmentInputEl.value) {
    attachmentInputEl.value.value = ''
  }
}

function openAttachmentPicker() {
  if (!isSkillAssistantMode.value || busy.value || attachmentUploading.value) return
  attachmentInputEl.value?.click()
}

function removePendingAttachment(id) {
  pendingAttachments.value = pendingAttachments.value.filter((item) => item.id !== id)
  if (!pendingAttachments.value.length) {
    attachmentUploadError.value = ''
  }
}

function buildPendingAttachmentRecord(file) {
  attachmentSelectionSeq += 1
  return {
    id: `pending-${Date.now()}-${attachmentSelectionSeq}`,
    file,
    name: String(file?.name || '').trim() || '未命名文件',
    size: Number(file?.size || 0),
    extension: getAttachmentExtension(file?.name),
    lastModified: Number(file?.lastModified || 0),
  }
}

function validatePendingAttachmentFiles(files) {
  const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : []
  if (!normalizedFiles.length) return ''

  const nextCount = pendingAttachments.value.length + normalizedFiles.length
  if (nextCount > SKILL_ATTACHMENT_MAX_FILES) {
    return `最多只能选择 ${SKILL_ATTACHMENT_MAX_FILES} 个附件`
  }

  let totalSize = pendingAttachments.value.reduce((sum, item) => sum + Number(item?.size || 0), 0)
  for (const file of normalizedFiles) {
    const extension = getAttachmentExtension(file?.name)
    if (!SKILL_ATTACHMENT_ALLOWED_EXTENSIONS.has(extension)) {
      return `不支持的文件类型：${extension || String(file?.name || '未知文件')}`
    }
    const size = Number(file?.size || 0)
    if (size > SKILL_ATTACHMENT_MAX_FILE_SIZE) {
      return `文件过大：${file.name}（单文件最大 ${formatAttachmentSize(SKILL_ATTACHMENT_MAX_FILE_SIZE)}）`
    }
    totalSize += size
    if (totalSize > SKILL_ATTACHMENT_MAX_TOTAL_SIZE) {
      return `附件总大小超过限制（最大 ${formatAttachmentSize(SKILL_ATTACHMENT_MAX_TOTAL_SIZE)}）`
    }
  }

  return ''
}

function handleAttachmentInputChange(event) {
  const rawFiles = Array.from(event?.target?.files || [])
  resetAttachmentInput()
  if (!rawFiles.length) return

  const validationMessage = validatePendingAttachmentFiles(rawFiles)
  if (validationMessage) {
    attachmentUploadError.value = validationMessage
    return
  }

  const existingKeys = new Set(
    pendingAttachments.value.map((item) => `${item.name}|${item.size}|${item.lastModified}`),
  )
  const nextPending = [...pendingAttachments.value]
  for (const file of rawFiles) {
    const dedupeKey = `${String(file?.name || '').trim()}|${Number(file?.size || 0)}|${Number(file?.lastModified || 0)}`
    if (existingKeys.has(dedupeKey)) continue
    existingKeys.add(dedupeKey)
    nextPending.push(buildPendingAttachmentRecord(file))
  }
  pendingAttachments.value = nextPending
  attachmentUploadError.value = ''
}

// Layout / drag
const workshopEl = ref(null)
const leftWidth = ref(40)
let dragging = false
let startX = 0
let startW = 0

function startDrag(e) {
  if (isMobile.value) return
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

function syncViewportMode() {
  if (typeof window === 'undefined') return
  const mobile = window.innerWidth <= 768
  isMobile.value = mobile
  if (!mobile) {
    mobileSidebarOpen.value = false
    return
  }
  mobilePane.value = mobilePane.value === 'result' ? 'result' : 'chat'
}

// Chat state
let messageKeySeq = 0
function allocMessageKey() {
  messageKeySeq += 1
  return messageKeySeq
}

const messages = ref([])
const inputText = ref('')
const isWelcomeScreen = computed(() => messages.value.length === 0 && !busy.value && !loading.value)
const canSendCurrentMessage = computed(() => {
  if (busy.value || attachmentUploading.value) return false
  if (!isSkillAssistantMode.value) return Boolean(inputText.value.trim())
  return Boolean(
    inputText.value.trim()
    || pendingAttachments.value.length
    || (uploadedAttachments.value.length && messages.value.length === 0),
  )
})
const WORKSHOP_MODE_STORAGE_KEY = 'workshop:generation-mode'
const generationMode = ref(loadGenerationMode())
/** SSE：给用户看的说明（Markdown） */
const streamingFriendly = ref('')
/** SSE：HTML 源码（转义后展示） */
const streamingHtml = ref('')
const streamingSegments = ref([])
/** 整段请求进行中（含 SSE 与上传），用于禁用发送避免重复提交 */
const busy = ref(false)
/** 仅用于底部“打字点”：首包前的等待、上传阶段 */
const loading = ref(false)
const chatTitle = ref('Agent 对话')
const messagesEl = ref(null)
const textareaEl = ref(null)
const conversationList = ref([])
const currentConversationId = ref('')
const editingConversationId = ref('')
const editingTitle = ref('')
const conversationPage = ref(0)
const deleteConversationModalOpen = ref(false)
const pendingDeleteConversationId = ref('')
let historyHydrating = false
let persistTimer = null
const historyReady = ref(false)
let persistInFlight = null
const deletedConversationIds = new Set()
const CONVERSATIONS_PER_PAGE = 5

const totalConversationPages = computed(() => {
  return Math.max(1, Math.ceil(conversationList.value.length / CONVERSATIONS_PER_PAGE))
})

const pagedConversationList = computed(() => {
  const start = conversationPage.value * CONVERSATIONS_PER_PAGE
  return conversationList.value.slice(start, start + CONVERSATIONS_PER_PAGE)
})

function loadGenerationMode() {
  if (typeof window === 'undefined') return 'single_html'
  const saved = window.localStorage.getItem(WORKSHOP_MODE_STORAGE_KEY)
  return saved === 'vite' ? 'vite' : 'single_html'
}

function buildModeSystemPrompt(mode) {
  if (mode === 'vite') {
    return '你是资深前端开发者。请使用 Vite 多文件工程实现需求，但默认优先选择 vanilla Vite，小而稳地组织文件。除非用户明确要求，否则不要擅自切换到 React、Vue 或 TypeScript 重工程方案。请合理拆分 index.html、src/main.js、核心模块和样式文件，保证生成结果可以直接运行，并在结束前自行检查关键文件是否齐全。'
  }
  return '你是资深前端开发者。对于游戏、动画、工具页等纯前端需求，直接生成单个 index.html，并内联所需 JS/CSS，不要创建 npm 项目。只有用户明确要求工程化方案时才使用 Vite。请尽量一步到位，减少不必要的文件操作。'
}

function setGenerationMode(mode) {
  generationMode.value = mode === 'vite' ? 'vite' : 'single_html'
}

function buildRecoveryContext(originalText) {
  return [
    '上一轮生成在同一个 workspace 中途被打断了。',
    '不要重新初始化项目，也不要重建脚手架。',
    '请直接基于当前已有文件继续完善，补齐缺失的入口、核心逻辑、样式和资源引用，直到项目可以正常运行并符合原始需求。',
    '如果发现技术栈选错了，请在保留当前 workspace 的前提下做最小必要调整。',
    `原始需求：${originalText}`,
  ].join('\n')
}

function shouldRetrySingleHtmlStreamError(message) {
  if (generationMode.value !== 'single_html') return false
  const text = String(message || '')
  return (
    text.includes('当前 session 没有可在线运行的项目')
    || text.includes('当前 session 没有可预览内容')
  )
}

function createEmptyPreviewState() {
  return {
    mode: 'empty',
    html: '',
    url: '',
    code: { lang: '', content: '' },
    frameState: 'idle',
    urlLoadError: false,
  }
}

// Right panel state
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
const showResultPanel = computed(() => !isSkillAssistantMode.value || showWorkspaceFiles.value)
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
  skillResolution: null,
  skillMaterialization: null,
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
const workspaceBootstrapLoading = ref(false)
const workspaceBootstrapError = ref('')
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
  if (workspaceBootstrapLoading.value) return '正在初始化当前会话的 workspace'
  if (workspaceBootstrapError.value) return workspaceBootstrapError.value
  if (workspaceTreeLoading.value) return '正在同步会话 workspace'
  if (workspaceTreeRoot.value) return '点击目录展开，点击文件查看内容'
  return '当前会话的 Agent-Do 工作目录'
})

const workspaceFlatNodes = computed(() => {
  const root = workspaceTreeRoot.value
  if (!root) return []

  const nodes = []
  const walk = (node, depth = 0, isRoot = false) => {
    if (!isRoot) {
      nodes.push({
        ...node,
        depth,
      })
    }
    if (node.type !== 'directory') return
    if (!isRoot && !isDirectoryExpanded(node.path)) return
    for (const child of node.children || []) {
      walk(child, depth + 1, false)
    }
  }

  walk(root, -1, true)
  return nodes
})

function snapshotPreviewState() {
  return {
    mode: previewMode.value,
    html: previewHtml.value,
    url: previewUrl.value,
    code: { ...previewCode.value },
    frameState: previewFrameState.value,
    urlLoadError: urlLoadError.value,
  }
}

function applyPreviewState(state) {
  const nextState = state || createEmptyPreviewState()
  previewMode.value = nextState.mode || 'empty'
  previewHtml.value = nextState.html || ''
  previewUrl.value = normalizeWorkshopPreviewUrl(nextState.url || '')
  previewCode.value = {
    lang: nextState.code?.lang || '',
    content: nextState.code?.content || '',
  }
  previewFrameState.value = nextState.frameState || (previewUrl.value || previewHtml.value ? 'loading' : 'idle')
  urlLoadError.value = Boolean(nextState.urlLoadError)
}

function preparePreviewForPendingRequest(previousState) {
  if (previousState?.mode && previousState.mode !== 'empty') {
    previewFrameState.value = 'loading'
    urlLoadError.value = false
    return
  }
  applyPreviewState(createEmptyPreviewState())
}

function workspaceTreeHasFiles(root) {
  if (!root || typeof root !== 'object') return false
  if (root.type === 'file') return true
  const children = Array.isArray(root.children) ? root.children : []
  return children.some((child) => workspaceTreeHasFiles(child))
}

async function canAutoRecoverCurrentWorkspace() {
  if (generationMode.value !== 'vite') return false
  if (!currentWorkspaceRequest.value.ready) return false
  if (!agentDoDebug.value.sessionId) return false

  if (workspaceTreeHasFiles(workspaceTreeRoot.value)) {
    return true
  }

  try {
    const data = await fetchAgentDoWorkspaceTree(currentWorkspaceRequest.value)
    return workspaceTreeHasFiles(data?.root)
  } catch (error) {
    console.warn('workspace recovery probe failed:', error)
    return false
  }
}

function resetWorkspaceBrowser() {
  workspaceBootstrapLoading.value = false
  workspaceBootstrapError.value = ''
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

function expandDirectoryChainForPath(path) {
  const normalized = String(path || '').trim().replace(/^\/+|\/+$/g, '')
  if (!normalized) return
  const segments = normalized.split('/').filter(Boolean)
  if (segments.length <= 1) return
  const nextExpanded = new Set(workspaceExpandedDirs.value)
  let currentPath = ''
  for (const segment of segments.slice(0, -1)) {
    currentPath = currentPath ? `${currentPath}/${segment}` : segment
    nextExpanded.add(currentPath)
  }
  workspaceExpandedDirs.value = Array.from(nextExpanded)
}

function fileIcon(path) {
  const lower = String(path || '').toLowerCase()
  if (lower.endsWith('.html')) return 'HTML'
  if (lower.endsWith('.css')) return 'CSS'
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) return 'JS'
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'TS'
  if (lower.endsWith('.json')) return 'JSON'
  if (lower.endsWith('.md')) return 'MD'
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg')) return 'IMG'
  return 'FILE'
}

let workspaceBootstrapInFlight = null

function applyEnsuredSessionToConversation(mapping) {
  const sessionId = String(mapping?.agentDoSessionId || '').trim()
  const workspacePath = String(mapping?.workspacePath || '').trim()
  if (!sessionId || !currentConversationId.value) return
  agentDoDebug.value.sessionId = sessionId
  agentDoDebug.value.workspacePath = workspacePath
  conversationList.value = conversationList.value.map((item) => {
    if (item.id !== currentConversationId.value) return item
    return {
      ...item,
      preview: {
        ...(item.preview || {}),
        agentDoSessionId: sessionId,
        workspacePath,
      },
      updatedAt: new Date().toISOString(),
    }
  })
  schedulePersist()
}

async function uploadPendingSkillAttachments() {
  if (!pendingAttachments.value.length) return []

  attachmentUploading.value = true
  attachmentUploadError.value = ''

  try {
    const response = await uploadSkillAssistantFiles(
      {
        username: currentWorkspaceRequest.value.username,
        conversationId: currentWorkspaceRequest.value.conversationId,
        title: chatTitle.value || 'Skill Assistant Session',
      },
      pendingAttachments.value.map((item) => item.file),
    )
    applyEnsuredSessionToConversation(response)
    uploadedAttachments.value = mergeUploadedAttachmentRecords(uploadedAttachments.value, response?.files || [])
    pendingAttachments.value = []
    if (showWorkspaceFiles.value && currentWorkspaceRequest.value.ready) {
      await loadWorkspaceTree(true)
    }
    return Array.isArray(response?.files) ? response.files : []
  } catch (error) {
    attachmentUploadError.value = error instanceof Error ? error.message : String(error)
    throw error
  } finally {
    attachmentUploading.value = false
  }
}

async function ensureSkillAssistantWorkspaceReady(options = {}) {
  const { force = false, silent = false } = options
  if (!isSkillAssistantMode.value) return true
  if (!currentWorkspaceRequest.value.ready) return false
  if (!force && agentDoDebug.value.sessionId) return true
  if (workspaceBootstrapInFlight) return workspaceBootstrapInFlight

  workspaceBootstrapLoading.value = true
  if (!silent) workspaceBootstrapError.value = ''

  workspaceBootstrapInFlight = (async () => {
    try {
      const ensured = await ensureAgentDoSessionMapping({
        username: currentWorkspaceRequest.value.username,
        conversationId: currentWorkspaceRequest.value.conversationId,
        title: chatTitle.value || 'Skill Assistant Session',
      })
      applyEnsuredSessionToConversation(ensured)
      workspaceBootstrapError.value = ''
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const friendly = `工作区初始化失败（${message}），可点击刷新重试`
      workspaceBootstrapError.value = friendly
      if (!silent) {
        workspaceTreeError.value = friendly
      }
      return false
    } finally {
      workspaceBootstrapLoading.value = false
      workspaceBootstrapInFlight = null
    }
  })()

  return workspaceBootstrapInFlight
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

  const workspaceReady = await ensureSkillAssistantWorkspaceReady({
    force,
    silent: !showWorkspaceFiles.value,
  })
  if (isSkillAssistantMode.value && !workspaceReady) {
    if (!showWorkspaceFiles.value) return
    workspaceTreeError.value = workspaceBootstrapError.value || '工作区初始化失败，可点击刷新重试'
    return
  }

  workspaceTreeLoading.value = true
  workspaceTreeError.value = ''
  try {
    const data = await fetchAgentDoWorkspaceTree(currentWorkspaceRequest.value)
    workspaceTreeRoot.value = data?.root || null
    workspaceExpandedDirs.value = ['']

    const stillSelected = workspaceSelectedFile.value.path
      ? workspaceFlatNodes.value.find((item) => item.path === workspaceSelectedFile.value.path)
      : null
    if (stillSelected?.type === 'file') {
      expandDirectoryChainForPath(stillSelected.path)
      await loadWorkspaceFile(stillSelected.path, true)
    } else if (!workspaceSelectedFile.value.path) {
      const firstFile = findFirstFileNode(data?.root)
      if (firstFile?.path) {
        expandDirectoryChainForPath(firstFile.path)
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
  expandDirectoryChainForPath(nextPath)
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
  if (!showWorkspaceFiles.value) {
    if (isSkillAssistantMode.value && isMobile.value) {
      mobilePane.value = 'chat'
    }
    return
  }
  // showSandboxPool.value = false // [容器池功能暂时禁用]
  showAgentDoDebug.value = false
  if (isSkillAssistantMode.value) {
    workspaceActiveView.value = 'file'
  }
  if (isMobile.value) {
    mobilePane.value = 'result'
  }
  await loadWorkspaceTree()
}

// Smart auto-scroll
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

// Elapsed timer
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

// Overall progress tracking
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
  if (runningTools.length) return `正在执行：${runningTools.map(t => t.title).join(', ')}`
  if (loading.value) return '正在准备中...'
  return 'Agent-Do 正在处理中'
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
  if (agentDoDebug.value.previewUrl) return '预览地址已经返回，正在加载页面内容。'
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

  if (agentDoReasoningPreview.value) {
    items.push({
      key: 'reasoning',
      kind: 'reasoning',
      icon: '思',
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
      subtitle: `${summarizeToolLog(tool)} / 耗时 ${formatToolDuration(tool)}`,
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
      icon: '✎',
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
      icon: '→',
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
      icon: '思',
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
      subtitle: `${summarizeToolLog(tool)} / 耗时 ${formatToolDuration(tool)}`,
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
      icon: '✎',
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
      icon: '⌛',
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
      chip: busy.value ? '进行中' : '空闲',
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

const selectedSkillsText = computed(() => {
  if (!selectedSkillMetas.value.length) return '-'
  return selectedSkillMetas.value
    .map((item) => `${item.name || item.id}${item.version ? ` (v${item.version})` : ''}`)
    .join('\n')
})

const skillResolutionText = computed(() => {
  const resolution = agentDoDebug.value.skillResolution
  return resolution ? JSON.stringify(resolution, null, 2) : '-'
})

const skillMaterializationText = computed(() => {
  const materialization = agentDoDebug.value.skillMaterialization
  return materialization ? JSON.stringify(materialization, null, 2) : '-'
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
    skillResolution: null,
    skillMaterialization: null,
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
    skillResolution: agentDoDebug.value.skillResolution || null,
    skillMaterialization: agentDoDebug.value.skillMaterialization || null,
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
  const currentPreview = current?.preview || {}
  const agentDoSessionId = agentDoDebug.value.sessionId || currentPreview.agentDoSessionId || ''
  const workspacePath = agentDoDebug.value.workspacePath || currentPreview.workspacePath || ''
  return {
    id: currentConversationId.value,
    title: chatTitle.value || '新对话',
    conversationMode: normalizeFunctionMode(current?.conversationMode || currentFunctionMode.value),
    orderIndex: current?.orderIndex ?? null,
    createdAt: current?.createdAt || new Date().toISOString(),
    messages: cloneMessages(messages.value),
    updatedAt: new Date().toISOString(),
    preview: {
      mode: previewMode.value,
      html: previewHtml.value,
      url: previewUrl.value,
      code: { ...previewCode.value },
      attachments: uploadedAttachments.value.map((item) => ({ ...item })),
      agentDoSessionId,
      workspacePath,
    },
  }
}

function clampConversationPage(page) {
  const maxPage = Math.max(0, totalConversationPages.value - 1)
  conversationPage.value = Math.min(Math.max(page, 0), maxPage)
}

function syncConversationPageById(id) {
  if (!id) {
    clampConversationPage(0)
    return
  }
  const index = conversationList.value.findIndex((item) => item.id === id)
  if (index === -1) {
    clampConversationPage(conversationPage.value)
    return
  }
  clampConversationPage(Math.floor(index / CONVERSATIONS_PER_PAGE))
}

function goToPreviousConversationPage() {
  clampConversationPage(conversationPage.value - 1)
}

function goToNextConversationPage() {
  clampConversationPage(conversationPage.value + 1)
}

function syncConversationRoute(id) {
  const nextId = String(id || '').trim()
  const currentId = String(route.query.cid || '').trim()
  if (!nextId || currentId === nextId) return
  const { new: _newConversationFlag, ...restQuery } = route.query || {}
  router.replace({
    path: '/workshop',
    query: {
      ...restQuery,
      cid: nextId,
    },
  })
}

function routeRequestsNewConversation() {
  return String(route.query.new || '').trim() === '1'
}

function emitWorkshopHistoryChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('workshop-history-changed'))
}

async function removeDeletedConversationLocally(conversationId, nextActiveId = '') {
  const deletedId = String(conversationId || '').trim()
  if (!deletedId) return
  deletedConversationIds.add(deletedId)
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  const nextList = conversationList.value.filter((item) => item.id !== deletedId)
  conversationList.value = nextList
  const nextConversation =
    nextList.find((item) => item.id === nextActiveId) ||
    nextList[0] ||
    null
  if (currentConversationId.value !== deletedId) {
    clampConversationPage(conversationPage.value)
    return
  }
  if (!nextConversation) {
    currentConversationId.value = ''
    clampConversationPage(conversationPage.value)
    return
  }
  await applyConversation(nextConversation)
}

function getConversationPreviewRecovery(conversation) {
  const preview = conversation?.preview || {}
  const directSessionId = String(preview.agentDoSessionId || '').trim()
  const directWorkspacePath = String(preview.workspacePath || '').trim()
  const previewUrlText = String(preview.url || '').trim()
  if (directSessionId) {
    return {
      agentDoSessionId: directSessionId,
      workspacePath: directWorkspacePath,
    }
  }
  if (!previewUrlText) return null
  try {
    const parsed = new URL(previewUrlText, window.location.origin)
    const agentDoSessionId = String(parsed.searchParams.get('agentDoSessionId') || '').trim()
    if (!agentDoSessionId) return null
    return {
      agentDoSessionId,
      workspacePath: String(parsed.searchParams.get('workspacePath') || directWorkspacePath || '').trim(),
    }
  } catch {
    return null
  }
}

async function restoreConversationSessionMapping(conversation) {
  const username = currentUser.value?.username || 'workshop_guest'
  const recovery = getConversationPreviewRecovery(conversation)
  if (!conversation?.id || !recovery?.agentDoSessionId) return null
  try {
    return await restoreAgentDoSessionMapping({
      username,
      conversationId: conversation.id,
      agentDoSessionId: recovery.agentDoSessionId,
      workspacePath: recovery.workspacePath || '',
    })
  } catch (error) {
    console.warn('restore Agent-Do session mapping failed:', error)
    return null
  }
}

async function applyConversation(conversation) {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  cancelRename()
  historyHydrating = true
  currentConversationId.value = conversation.id
  syncConversationPageById(conversation.id)
  syncConversationRoute(conversation.id)
  chatTitle.value = conversation.title || '新对话'
  messages.value = cloneMessages(conversation.messages || [])
  const restoredMapping = await restoreConversationSessionMapping(conversation)
  const restoredWorkspacePath = restoredMapping?.workspacePath || conversation.preview?.workspacePath || ''
  previewMode.value = conversation.preview?.mode || 'empty'
  previewHtml.value = conversation.preview?.html || ''
  previewUrl.value = normalizeWorkshopPreviewUrl(conversation.preview?.url || '')
  previewFrameState.value = previewUrl.value || previewHtml.value ? 'loading' : 'idle'
  previewCode.value = {
    lang: conversation.preview?.code?.lang || '',
    content: conversation.preview?.code?.content || '',
  }
  uploadedAttachments.value = mergeUploadedAttachmentRecords([], conversation.preview?.attachments || [])
  pendingAttachments.value = []
  attachmentUploadError.value = ''
  resetAttachmentInput()
  streamingFriendly.value = ''
  streamingHtml.value = ''
  resetAgentDoDebug()
  agentDoDebug.value.sessionId = restoredMapping?.agentDoSessionId || conversation.preview?.agentDoSessionId || ''
  agentDoDebug.value.workspacePath = restoredWorkspacePath
  agentDoDebug.value.previewUrl = previewUrl.value
  resetWorkspaceBrowser()
  urlLoadError.value = false
  nextTick(() => {
    historyHydrating = false
    scrollBottom()
  })
}

async function waitForConversationApply() {
  await nextTick()
}

function hasMeaningfulConversationContent(conversation) {
  if (!conversation) return false
  const messagesList = Array.isArray(conversation.messages) ? conversation.messages : []
  if (messagesList.length > 0) return true
  const preview = conversation.preview || {}
  if (String(preview.html || '').trim()) return true
  if (String(preview.url || '').trim()) return true
  if (String(preview?.code?.content || '').trim()) return true
  return false
}

function isUnsavedEmptyDraftConversation(conversation) {
  if (!conversation) return false
  return conversation.orderIndex == null && !hasMeaningfulConversationContent(conversation)
}

function discardUnsavedEmptyDraftConversation(id) {
  const conversationId = String(id || '').trim()
  if (!conversationId) return false
  const conversation = conversationList.value.find((item) => item.id === conversationId)
  if (!isUnsavedEmptyDraftConversation(conversation)) return false
  conversationList.value = conversationList.value.filter((item) => item.id !== conversationId)
  if (currentConversationId.value === conversationId) {
    currentConversationId.value = ''
  }
  return true
}

async function persistConversations() {
  if (historyHydrating || !historyReady.value || !currentUser.value?.username || !currentConversationId.value) return
  if (persistInFlight) return persistInFlight
  persistInFlight = (async () => {
    const snapshot = buildConversationSnapshot()
    if (deletedConversationIds.has(snapshot.id)) {
      return snapshot
    }
    const nextList = [...conversationList.value]
    const index = nextList.findIndex((item) => item.id === snapshot.id)
    if (index < 0) {
      return snapshot
    }
    const existingConversation = index >= 0 ? nextList[index] : null
    const shouldPersist = hasMeaningfulConversationContent(snapshot) || existingConversation?.orderIndex != null
    const contentChanged = hasConversationContentChanged(existingConversation, snapshot)
    if (!shouldPersist) {
      return existingConversation || snapshot
    }
    if (!hasConversationChanged(existingConversation, snapshot) && existingConversation) {
      return existingConversation
    }
    const effectiveUpdatedAt = contentChanged
      ? snapshot.updatedAt
      : String(existingConversation?.updatedAt || snapshot.updatedAt || '')
    if (index >= 0) {
      nextList[index] = {
        ...nextList[index],
        ...snapshot,
        updatedAt: effectiveUpdatedAt,
        createdAt: nextList[index].createdAt || snapshot.updatedAt,
      }
    } else {
      nextList.push({
        ...snapshot,
        updatedAt: effectiveUpdatedAt,
        createdAt: snapshot.updatedAt,
      })
    }
    conversationList.value = nextList
    const saved = await saveWorkshopConversation(snapshot)
    if (deletedConversationIds.has(saved.id)) {
      return saved
    }
    const savedIndex = conversationList.value.findIndex((item) => item.id === saved.id)
    if (savedIndex >= 0) {
      const merged = [...conversationList.value]
      merged[savedIndex] = {
        ...merged[savedIndex],
        ...saved,
      }
      conversationList.value = merged
    }
  })()
  try {
    await persistInFlight
  } finally {
    persistInFlight = null
  }
}

function schedulePersist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(async () => {
    await persistConversations()
    persistTimer = null
  }, 120)
}

async function flushPendingPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  await persistConversations()
}

async function createNewConversation(options = {}) {
  const { startRename: shouldStartRename = true } = options
  await flushPendingPersist()
  const currentConversation = conversationList.value.find((item) => item.id === currentConversationId.value)
  if (isUnsavedEmptyDraftConversation(currentConversation)) {
    syncConversationPageById(currentConversation.id)
    await applyConversation(currentConversation)
    await waitForConversationApply()
    if (shouldStartRename) {
      startRename(currentConversation.id)
    }
    return currentConversation
  }
  const conversation = createEmptyConversation(undefined, currentFunctionMode.value)
  conversationList.value = [...conversationList.value, conversation]
  syncConversationPageById(conversation.id)
  await applyConversation(conversation)
  await waitForConversationApply()
  if (conversation.conversationMode === 'skill_assistant') {
    await ensureSkillAssistantWorkspaceReady({ force: true, silent: false })
  }
  if (isMobile.value) {
    mobilePane.value = 'chat'
    mobileSidebarOpen.value = false
  }
  if (shouldStartRename) {
    startRename(conversation.id)
  }
  return conversation
}

async function handleExternalCreateConversation(event) {
  if (!historyReady.value || busy.value) return
  const requestedMode = normalizeFunctionMode(event?.detail?.mode || route.query.fm)
  if (requestedMode !== currentFunctionMode.value) {
    await router.push({ path: '/workshop', query: { ...route.query, fm: requestedMode, new: '1' } })
    return
  }
  await createNewConversation({ startRename: false })
}

async function handleExternalConversationDeleted(event) {
  const conversationId = String(event?.detail?.conversationId || '').trim()
  const nextActiveId = String(event?.detail?.nextActiveId || '').trim()
  await removeDeletedConversationLocally(conversationId, nextActiveId)
}

async function switchConversation(id) {
  if (!id || id === currentConversationId.value || busy.value || editingConversationId.value) return
  const conversation = conversationList.value.find((item) => item.id === id)
  if (!conversation) return
  const discardedDraft = discardUnsavedEmptyDraftConversation(currentConversationId.value)
  if (!discardedDraft) {
    await flushPendingPersist()
  }
  await applyConversation(conversation)
  if (isMobile.value) {
    mobilePane.value = 'chat'
    mobileSidebarOpen.value = false
  }
}

function onDeleteConversationModalCancel() {
  pendingDeleteConversationId.value = ''
}

function requestDeleteConversation(id) {
  if (!id || conversationList.value.length <= 1 || busy.value) return
  pendingDeleteConversationId.value = id
  deleteConversationModalOpen.value = true
}

async function confirmDeleteConversation() {
  const id = pendingDeleteConversationId.value
  pendingDeleteConversationId.value = ''
  if (!id || conversationList.value.length <= 1 || busy.value) return
  await flushPendingPersist()
  const currentIndex = conversationList.value.findIndex((item) => item.id === id)
  const nextList = conversationList.value.filter((item) => item.id !== id)
  const nextActiveConversation =
    nextList[currentIndex] ||
    nextList[currentIndex - 1] ||
    nextList[0] ||
    null
  deletedConversationIds.add(id)
  try {
    await deleteWorkshopConversationDeep({
      username: currentUser.value?.username || 'workshop_guest',
      conversationId: id,
    })
    removeWorkshopConversationState(
      currentUser.value?.username || 'workshop_guest',
      id,
      nextActiveConversation?.id || '',
    )
    await removeDeletedConversationLocally(id, nextActiveConversation?.id || '')
    emitWorkshopHistoryChanged()
  } catch (e) {
    deletedConversationIds.delete(id)
    console.error('delete conversation failed:', e)
    return
  }
}

async function loadWorkshopHistory() {
  if (!currentUser.value?.username) {
    router.push('/login')
    return
  }
  const conversations = await fetchWorkshopConversations()
  conversationList.value = Array.isArray(conversations)
    ? conversations.map((item) => ({
      ...item,
      conversationMode: normalizeFunctionMode(item?.conversationMode || currentFunctionMode.value),
    }))
    : []
  const routeConversationId = String(route.query.cid || '').trim()
  let current = conversationList.value.find((item) => item.id === routeConversationId) || conversationList.value[0]
  if (!current) {
    current = createEmptyConversation(undefined, currentFunctionMode.value)
    conversationList.value = [current]
    historyReady.value = true
    await applyConversation(current)
    await waitForConversationApply()
    await persistConversations()
    emitWorkshopHistoryChanged()
    return
  }
  syncConversationPageById(current.id)
  await applyConversation(current)
  historyReady.value = true
  emitWorkshopHistoryChanged()
  if (routeRequestsNewConversation()) {
    await handleExternalCreateConversation()
  }
}

function normalizeConversationComparable(conversation) {
  return JSON.stringify({
    id: String(conversation?.id || ''),
    title: String(conversation?.title || ''),
    conversationMode: normalizeFunctionMode(conversation?.conversationMode || 'workshop'),
    orderIndex: conversation?.orderIndex ?? null,
    createdAt: String(conversation?.createdAt || ''),
    messages: Array.isArray(conversation?.messages) ? conversation.messages : [],
    preview: conversation?.preview || {},
  })
}

function hasConversationContentChanged(existingConversation, snapshot) {
  if (!existingConversation) return true
  return JSON.stringify({
    messages: Array.isArray(existingConversation?.messages) ? existingConversation.messages : [],
    preview: existingConversation?.preview || {},
  }) !== JSON.stringify({
    messages: Array.isArray(snapshot?.messages) ? snapshot.messages : [],
    preview: snapshot?.preview || {},
  })
}

function hasConversationChanged(existingConversation, snapshot) {
  if (!existingConversation) return true
  return normalizeConversationComparable(existingConversation) !== normalizeConversationComparable(snapshot)
}

async function logout() {
  await flushPendingPersist()
  await logoutApi().catch(() => null)
  clearCurrentUser()
  router.push('/login')
}

function toggleSidebar() {
  if (!isMobile.value) return
  mobileSidebarOpen.value = !mobileSidebarOpen.value
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
    const payload = currentConversationId.value === id
      ? {
          ...buildConversationSnapshot(),
          title,
        }
      : nextList[index]
    const saved = await saveWorkshopConversation(payload)
    const savedIndex = conversationList.value.findIndex((item) => item.id === id)
    if (savedIndex >= 0) {
      const merged = [...conversationList.value]
      merged[savedIndex] = {
        ...merged[savedIndex],
        ...saved,
      }
      conversationList.value = merged
    }
    emitWorkshopHistoryChanged()
  } catch (e) {
    // 改名先保证前端立即生效；若后端同步失败，保留当前标题，避免用户感觉“没有反应”。
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
  if (tool.status === 'error') return '!'
  if (tool.status === 'completed') return 'OK'
  if (tool.title?.toLowerCase().includes('read')) return 'READ'
  if (tool.title?.toLowerCase().includes('bash') || tool.title?.toLowerCase().includes('command')) return 'CMD'
  if (tool.title?.toLowerCase().includes('write') || tool.title?.toLowerCase().includes('edit')) return 'EDIT'
  return tool.status === 'running' ? 'RUN' : '...'
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
  if (!normalized) return 'Agent-Do 正在处理这个步骤...'
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

/** 右侧仅在整段 HTML 生成结束后首次展示，流式过程中不频繁刷新 iframe。 */
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

// Textarea auto-resize
function autoResize() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

// Title extraction
function extractTitle(text) {
  const m = text.match(/帮我(?:生成|做|创建|开发|设计).*?([^\s，。！？!?,]{2,8})(?:系统|平台|工具|页面|应用|网站|程序)?/)
  if (m) return m[1] + (text.match(/系统|平台|工具|页面|应用|网站|程序/) || [''])[0]
  return null
}

// 流式 HTML 源码展示：不做 Markdown 解析，仅转义 + 换行
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

function sanitizeAgentDoFinalAnswer(answer, { previewUrl, acceptance } = {}) {
  const text = String(answer || '').trim()
  if (!text) return ''

  const hasPreview = Boolean(String(previewUrl || '').trim())
  const acceptancePassed = Boolean(acceptance?.passed)
  if (!hasPreview) return text

  const lines = text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)

  const suspiciousPermissionPattern = /\/workspace|写权限|权限问题|sudo chown|docker run -u root|\/data\/workspace|目录没有写权限/i
  const filtered = lines.filter((line) => !suspiciousPermissionPattern.test(line))
  const cleaned = filtered.join('\n').trim()

  if (!cleaned && acceptancePassed) {
    return '页面已生成完成，预览可直接打开。'
  }
  return cleaned || text
}

function buildAgentDoChatMarkdown({ answer, previewUrl, elapsed, acceptance } = {}) {
  const sections = []
  const finalAnswer = sanitizeAgentDoFinalAnswer(answer, { previewUrl, acceptance })
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

function formatAcceptanceSummary(acceptance) {
  if (!acceptance || typeof acceptance !== 'object') return ''
  const finalAcceptance = acceptance.acceptance || acceptance
  const issues = Array.isArray(finalAcceptance.issues) ? finalAcceptance.issues : []
  const warnings = Array.isArray(finalAcceptance.warnings) ? finalAcceptance.warnings : []
  const rounds = Number(acceptance.repairRoundsUsed || 0)
  if (acceptance.passed) {
    return rounds > 0
      ? `已通过浏览器自动验收，并自动修复了 ${rounds} 轮。`
      : '已通过浏览器自动验收。'
  }
  const lead = issues[0] || warnings[0] || '自动验收仍未通过'
  return rounds > 0
    ? `自动修复 ${rounds} 轮后仍有问题：${lead}`
    : `自动验收未通过：${lead}`
}

function buildAgentDoAssistantSegments({ previewUrl, elapsed } = {}) {
  const content = buildAgentDoChatMarkdown({
    answer: agentDoLive.value.answer,
    previewUrl: previewUrl || agentDoDebug.value.previewUrl,
    elapsed,
    acceptance: null,
  })
  if (!content) return []
  return [{ kind: 'text', content }]
}

function syncAgentDoStreamingAnswer({ previewUrl, acceptance } = {}) {
  const content = buildAgentDoChatMarkdown({
    answer: agentDoLive.value.answer,
    previewUrl: previewUrl || agentDoDebug.value.previewUrl,
    acceptance,
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
    agentDoDebug.value.skillResolution = event.skills?.resolution || null
    agentDoDebug.value.skillMaterialization = event.skills?.materialization || null
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
    if (event.acceptance) {
      const acceptanceText = formatAcceptanceSummary(event.acceptance)
      if (acceptanceText) {
        agentDoLive.value.steps.push({
          id: `acceptance-${Date.now()}`,
          stage: 'acceptance',
          content: acceptanceText,
        })
      }
    }
    agentDoLive.value.steps.push({
      id: `result-${Date.now()}`,
      stage: 'result',
      content: '预览地址已生成，可以开始加载页面。',
    })
    syncAgentDoStreamingAnswer({ previewUrl: event.url, acceptance: event.acceptance })
    return event
  }

  if (event.type === 'error') {
    agentDoDebug.value.lastError = event.content || 'Agent-Do 流式生成失败'
    markAgentDoStage('error')
    agentDoLive.value.steps.push({
      id: `error-${Date.now()}`,
      stage: 'error',
      content: event.content || 'Agent-Do 流式生成出现异常，正在继续等待结果...',
    })
    syncAgentDoStreamingPlaceholder('生成过程中出现异常，正在尝试继续完成预览...')
    return {
      type: 'stream_error',
      error: event.content || 'Agent-Do 流式生成失败',
    }
  }

  return null
}

// HTML 输出兜底清洗：避免说明文字或 Markdown 代码围栏混入部署文件
function normalizeGeneratedHtml(raw) {
  if (!raw) return ''
  let s = raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .trim()

  // 兼容模型误输出的 Markdown 围栏
  s = s.replace(/^```(?:html)?\s*/i, '')
  s = s.replace(/\s*```$/i, '')

  // 优先从 doctype 截取，否则从 <html 开始截取
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

// 强制让生成的单文件页面铺满当前预览 iframe，避免左右留白或高度不匹配
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

// Send message
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

  try {
    await ensureSkillAssistantWorkspaceReady({ silent: true })
    for await (const part of streamGenerateText(
      text,
      '你是专业的 Skill 助手。请直接输出清晰、可执行的文本答案；'
      + '除非用户明确要求，不要生成 HTML 页面代码。',
      {
        conversationId: currentWorkspaceRequest.value.conversationId,
        username: currentWorkspaceRequest.value.username,
        title: chatTitle.value || 'Skill Assistant Session',
        manualSkillIds: selectedSkillIds.value,
        autoResolveSkills: true,
        skillMode: currentFunctionMode.value,
        maxSkillCount: 3,
      },
    )) {
      // Skill Assistant 一律按文本流式展示，避免误入 HTML 预览链路
      streamingFriendly.value += part.content
      await nextTick()
      scrollBottom()
    }

    const answerText = streamingFriendly.value.trim()
    assistantMsg.streamingLive = false
    streamingFriendly.value = ''
    streamingHtml.value = ''
    assistantMsg.segments = [
      {
        kind: 'text',
        content: answerText || '已完成，但未收到可展示内容，请重试一次。',
      },
    ]
    // Skill Assistant 不应污染右侧预览状态
    previewMode.value = 'empty'
    previewUrl.value = ''
    previewHtml.value = ''
    previewCode.value = { lang: '', content: '' }

  } catch (e) {
    assistantMsg.streamingLive = false
    assistantMsg.agentDoTrace = buildAgentDoTraceSnapshot()
    streamingFriendly.value = ''
    streamingHtml.value = ''
    const errorMsg = e.name === 'AbortError'
      ? '请求超时，请稍后重试'
      : `请求失败：${e.message}`
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
  if (currentFunctionMode.value === 'skill_assistant') {
    const text = inputText.value.trim()
    const shouldSendDefaultPrompt = !text && (
      pendingAttachments.value.length > 0
      || (uploadedAttachments.value.length > 0 && messages.value.length === 0)
    )
    if (!text && !shouldSendDefaultPrompt) return

    try {
      if (pendingAttachments.value.length) {
        await uploadPendingSkillAttachments()
      }
    } catch {
      return
    }

    await sendLegacyMessage({
      textOverride: text || SKILL_ATTACHMENT_DEFAULT_PROMPT,
    })
    return
  }

  const text = inputText.value.trim()
  if (!text || busy.value) return

  if (shouldForkFailedSingleHtmlConversation()) {
    await createNewConversation({ startRename: false })
  }

  const previousPreviewState = snapshotPreviewState()
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
    systemPrompt: buildModeSystemPrompt(generationMode.value),
    conversationId: currentConversationId.value || `conv-${Date.now()}`,
    username: currentUser.value?.username || 'workshop_guest',
    title: title || chatTitle.value || 'Workshop Project',
    generationMode: generationMode.value,
    manualSkillIds: selectedSkillIds.value,
    autoResolveSkills: true,
    skillMode: currentFunctionMode.value,
    maxSkillCount: 3,
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
    preparePreviewForPendingRequest(previousPreviewState)

    const conversationId = currentConversationId.value || `conv-${Date.now()}`
    const username = currentUser.value?.username || 'workshop_guest'
    const requestTitle = title || chatTitle.value || 'Workshop Project'
    const systemPrompt = buildModeSystemPrompt(generationMode.value)

    async function runAgentDoAttempt(attemptContext) {
      let attemptResult = null
      let attemptStreamError = ''
      for await (const event of streamPreviewWithAgentDo({
        context: attemptContext,
        systemPrompt,
        conversationId,
        username,
        title: requestTitle,
        generationMode: generationMode.value,
        manualSkillIds: selectedSkillIds.value,
        autoResolveSkills: true,
        skillMode: currentFunctionMode.value,
        maxSkillCount: 3,
      })) {
        const maybeResult = applyAgentDoStreamEvent(event)
        if (maybeResult?.type === 'stream_error') {
          attemptStreamError = maybeResult.error || attemptStreamError
        }
        if (maybeResult?.url) {
          attemptResult = maybeResult
          previewUrl.value = maybeResult.url
          previewMode.value = 'url'
          previewFrameState.value = 'loading'
          urlLoadError.value = false
          iframeKey.value++
        }
        await nextTick()
        scrollBottom()
      }
      return { attemptResult, attemptStreamError }
    }

    let { attemptResult: finalResult, attemptStreamError: streamErrorMessage } = await runAgentDoAttempt(text)

    const allowRecovery = streamErrorMessage ? await canAutoRecoverCurrentWorkspace() : false

    if (generationMode.value === 'vite' && streamErrorMessage && allowRecovery) {
      agentDoLive.value.steps.push({
        id: `recovery-${Date.now()}`,
        stage: 'repair',
        content: '检测到本轮生成中断，正在基于当前工作区自动补齐缺失文件...',
      })
      syncAgentDoStreamingPlaceholder('检测到生成中断，正在自动继续完善当前 Vite 项目...')
      const recovery = await runAgentDoAttempt(buildRecoveryContext(text))
      if (recovery.attemptResult?.url) {
        finalResult = recovery.attemptResult
      }
      if (!finalResult && recovery.attemptStreamError) {
        streamErrorMessage = recovery.attemptStreamError
      }
    } else if (generationMode.value === 'vite' && streamErrorMessage && !allowRecovery) {
      agentDoLive.value.steps.push({
        id: `recovery-skip-${Date.now()}`,
        stage: 'repair',
        content: '检测到流式中断，但当前工作区还没有可继续修复的文件，已跳过自动续修以避免重建默认脚手架。',
      })
    } else if (streamErrorMessage && shouldRetrySingleHtmlStreamError(streamErrorMessage)) {
      agentDoLive.value.steps.push({
        id: `html-recovery-${Date.now()}`,
        stage: 'repair',
        content: '检测到 HTML 预览会话异常，正在自动重试并重建可预览页面...',
      })
      syncAgentDoStreamingPlaceholder('检测到 HTML 预览会话异常，正在自动重试...')
      const recovery = await runAgentDoAttempt([
        '刚才这轮 HTML 生成已经失败过一次。',
        '不要提问，直接重新生成一个可以立即预览的单文件页面。',
        '请务必在 /workspace/index.html 中产出完整 HTML，保证可以直接预览。',
        `原始需求：${text}`,
      ].join('\n'))
      if (recovery.attemptResult?.url) {
        finalResult = recovery.attemptResult
        streamErrorMessage = ''
      } else if (recovery.attemptStreamError) {
        streamErrorMessage = recovery.attemptStreamError
      }
    }

    agentDoDebug.value.requestCompletedAt = Date.now()
    stopElapsedTimer()
    assistantMsg.streamingLive = false
    const baseSegments = buildAgentDoAssistantSegments({
      previewUrl: finalResult?.url,
      elapsed: formattedElapsed.value,
      acceptance: finalResult?.acceptance,
    })
    const extraSegments = []
    const acceptanceSummary = formatAcceptanceSummary(finalResult?.acceptance)
    if (streamErrorMessage) {
      extraSegments.push({
        kind: 'text',
        content: '本轮生成中途出现过异常，当前预览可能是自动补全后的结果。如果效果仍不对，继续在当前对话里让我“基于现有工程继续修正”会更稳。',
      })
    }
    if (acceptanceSummary) {
      extraSegments.push({
        kind: 'text',
        content: finalResult?.acceptance?.passed
          ? `✎${acceptanceSummary}`
          : `鈿狅笍 ${acceptanceSummary}`,
      })
    }
    assistantMsg.segments = [...extraSegments, ...baseSegments]
    assistantMsg.time = nowTime()
    streamingSegments.value = []
    if (!finalResult) {
      throw new Error(streamErrorMessage || 'Agent-Do 未返回预览地址')
    }
    await loadWorkspaceTree(true)
    await nextTick()
    forceScrollBottom()
  } catch (_error) {
    applyPreviewState(previousPreviewState)
    stopElapsedTimer()
    assistantMsg.streamingLive = false
    assistantMsg.agentDoTrace = buildAgentDoTraceSnapshot()
    assistantMsg.segments = [
      {
        kind: 'text',
        content: `Agent-Do 生成失败：${_error instanceof Error ? _error.message : String(_error)}`,
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
  pendingAttachments.value = []
  attachmentUploadError.value = ''
  resetAttachmentInput()
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

function messageContainsAgentDoFailure(message) {
  if (!message || message.role !== 'assistant') return false
  const legacyContent = String(message.content || '')
  if (
    legacyContent.includes('Agent-Do 生成失败')
    || legacyContent.includes('当前 session 没有可在线运行的项目')
  ) {
    return true
  }
  const segments = Array.isArray(message.segments) ? message.segments : []
  return segments.some((segment) => {
    const content = String(segment?.content || '')
    return content.includes('Agent-Do 生成失败') || content.includes('当前 session 没有可在线运行的项目')
  })
}

function shouldForkFailedSingleHtmlConversation() {
  if (generationMode.value !== 'single_html') return false
  if (!Array.isArray(messages.value) || messages.value.length === 0) return false
  if (previewUrl.value || previewHtml.value || previewCode.value?.content) return false
  return true
}

onMounted(async () => {
  if (typeof window !== 'undefined') {
    loadStoredSkillSelection()
    window.addEventListener(WORKSHOP_CREATE_CONVERSATION_EVENT, handleExternalCreateConversation)
    window.addEventListener(WORKSHOP_CONVERSATION_DELETED_EVENT, handleExternalConversationDeleted)
    window.addEventListener(WORKSHOP_SKILL_SELECTED_EVENT, handleSkillSelectionChanged)
    window.addEventListener('resize', syncViewportMode)
    syncViewportMode()
  }
  try {
    await loadWorkshopHistory()
  } catch (e) {
    const fallback = createEmptyConversation(undefined, currentFunctionMode.value)
    conversationList.value = [fallback]
    historyReady.value = true
    await applyConversation(fallback)
  }
})

watch(
  () => generationMode.value,
  (mode) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(WORKSHOP_MODE_STORAGE_KEY, mode)
  },
  { immediate: true },
)

watch(
  [messages, chatTitle, previewMode, previewHtml, previewUrl, previewCode],
  () => {
    if (historyHydrating) return
    schedulePersist()
  },
  { deep: true },
)

watch(
  () => uploadedAttachments.value,
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
    const conversation = conversationList.value.find((item) => item.id === currentConversationId.value)
    if (conversation) {
      await restoreConversationSessionMapping(conversation)
    }
    if (showWorkspaceFiles.value && currentWorkspaceRequest.value.ready) {
      await loadWorkspaceTree(true)
    }
  },
)

watch(
  () => conversationList.value.length,
  () => {
    clampConversationPage(conversationPage.value)
  },
)

watch(
  () => currentConversationId.value,
  (id) => {
    syncConversationPageById(id)
  },
)

watch(
  () => route.query.cid,
  async (id) => {
    const nextId = String(id || '').trim()
    if (!nextId || !historyReady.value || nextId === currentConversationId.value) return
    const conversation = conversationList.value.find((item) => item.id === nextId)
    if (!conversation) return
    const discardedDraft = discardUnsavedEmptyDraftConversation(currentConversationId.value)
    if (!discardedDraft) {
      await flushPendingPersist()
    }
    await applyConversation(conversation)
  },
)

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener(WORKSHOP_CREATE_CONVERSATION_EVENT, handleExternalCreateConversation)
    window.removeEventListener(WORKSHOP_CONVERSATION_DELETED_EVENT, handleExternalConversationDeleted)
    window.removeEventListener(WORKSHOP_SKILL_SELECTED_EVENT, handleSkillSelectionChanged)
    window.removeEventListener('resize', syncViewportMode)
  }
  stopDrag()
  stopElapsedTimer()
  if (persistTimer) clearTimeout(persistTimer)
  persistConversations()
})

watch(
  () => route.query.new,
  async (flag) => {
    if (String(flag || '').trim() !== '1' || !historyReady.value) return
    await handleExternalCreateConversation()
  },
)

watch(
  () => showResultPanel.value,
  (visible) => {
    if (visible) return
    if (mobilePane.value === 'result') {
      mobilePane.value = 'chat'
    }
  },
)
</script>

<style scoped>
.workshop {
  --welcome-shell-bg:
    radial-gradient(circle at 82% 12%, rgba(255, 212, 140, 0.18), transparent 18%),
    radial-gradient(circle at 14% 18%, rgba(59, 130, 246, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(241, 245, 249, 0.72));
  --welcome-panel-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(233, 241, 251, 0.72)),
    radial-gradient(circle at 50% 12%, rgba(255, 244, 214, 0.9), transparent 11%),
    radial-gradient(circle at 18% 36%, rgba(159, 196, 255, 0.18), transparent 24%),
    radial-gradient(circle at 86% 28%, rgba(255, 213, 161, 0.18), transparent 18%),
    linear-gradient(180deg, #edf4fb 0%, #d5e1ef 38%, #c5d2e1 100%);
  --welcome-panel-shadow: 0 28px 70px rgba(148, 163, 184, 0.28);
  --welcome-meta-color: rgba(71, 85, 105, 0.92);
  --welcome-title-color: #0f172a;
  --welcome-subtitle-color: rgba(71, 85, 105, 0.72);
  --welcome-hero-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(226, 232, 240, 0.32)),
    linear-gradient(180deg, rgba(196, 210, 226, 0.4), rgba(242, 247, 251, 0.72));
  --welcome-hero-border: rgba(148, 163, 184, 0.22);
  --welcome-hero-overlay:
    radial-gradient(circle at 50% 16%, rgba(255, 249, 235, 0.7), transparent 12%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(148, 163, 184, 0.08));
  --welcome-art-bg:
    radial-gradient(circle at 50% 14%, rgba(255, 255, 255, 0.88), transparent 9%),
    radial-gradient(circle at 16% 40%, rgba(147, 197, 253, 0.2), transparent 22%),
    radial-gradient(circle at 84% 28%, rgba(251, 191, 36, 0.16), transparent 16%);
  --welcome-eyebrow-border: rgba(148, 163, 184, 0.28);
  --welcome-eyebrow-bg: rgba(255, 255, 255, 0.52);
  --welcome-eyebrow-color: rgba(51, 65, 85, 0.88);
  --welcome-headline-color: #0f172a;
  --welcome-desc-color: rgba(51, 65, 85, 0.88);
  --welcome-composer-bg: rgba(255, 255, 255, 0.64);
  --welcome-composer-border: rgba(148, 163, 184, 0.22);
  --welcome-composer-shadow: 0 20px 48px rgba(148, 163, 184, 0.24);
  --welcome-textarea-color: #0f172a;
  --welcome-placeholder-color: rgba(100, 116, 139, 0.72);
  --welcome-send-bg: rgba(99, 102, 241, 0.14);
  --welcome-send-bg-hover: rgba(99, 102, 241, 0.24);
  --welcome-send-color: #3730a3;
  --preview-surface-color: rgba(30, 41, 59, 0.82);
  --preview-surface-bg:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.82), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(241, 245, 249, 0.92));
  --preview-surface-border: rgba(148, 163, 184, 0.18);
  --preview-surface-grid: rgba(148, 163, 184, 0.16);
  --preview-surface-orb-color: rgba(51, 65, 85, 0.88);
  --preview-surface-orb-bg: rgba(255, 255, 255, 0.54);
  --preview-surface-ring: rgba(99, 102, 241, 0.26);
  --preview-surface-title: #0f172a;
  --preview-surface-text: rgba(71, 85, 105, 0.82);
  --preview-surface-tip-text: rgba(71, 85, 105, 0.84);
  --preview-surface-tip-bg: rgba(255, 255, 255, 0.64);
  --preview-surface-tip-border: rgba(148, 163, 184, 0.2);
  --preview-strip-bg: rgba(255, 255, 255, 0.54);
  --preview-strip-border: rgba(148, 163, 184, 0.18);
  --preview-strip-title: #0f172a;
  --preview-strip-text: rgba(71, 85, 105, 0.82);
  --preview-strip-chip-bg: rgba(255, 255, 255, 0.66);
  --preview-strip-chip-border: rgba(148, 163, 184, 0.2);
  --preview-strip-chip-text: rgba(51, 65, 85, 0.86);
  display: flex;
  height: calc(100vh - 48px);
  overflow: hidden;
  background: var(--workshop-bg);
  color: var(--text-primary);
  font-family: var(--font-family-base);
  min-height: 720px;
  border-radius: 28px;
  border: 1px solid var(--workshop-border);
  box-shadow: var(--shadow-soft);
}

.workshop--dark {
  --welcome-shell-bg:
    radial-gradient(circle at 78% 12%, rgba(255, 236, 184, 0.12), transparent 18%),
    radial-gradient(circle at 16% 18%, rgba(129, 140, 248, 0.14), transparent 22%),
    linear-gradient(180deg, rgba(100, 116, 139, 0.08), rgba(15, 23, 42, 0.02));
  --welcome-panel-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(9, 12, 18, 0.12)),
    radial-gradient(circle at 48% 12%, rgba(255, 245, 214, 0.28), transparent 12%),
    radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.12), transparent 8%),
    radial-gradient(circle at 80% 34%, rgba(34, 43, 58, 0.4), transparent 20%),
    radial-gradient(circle at 18% 34%, rgba(160, 174, 192, 0.14), transparent 24%),
    linear-gradient(180deg, #6a7d91 0%, #33475d 34%, #1b2430 68%, #0a0f18 100%);
  --welcome-panel-shadow: 0 28px 70px rgba(15, 23, 42, 0.24);
  --welcome-meta-color: rgba(226, 232, 240, 0.9);
  --welcome-title-color: #f8fafc;
  --welcome-subtitle-color: rgba(226, 232, 240, 0.42);
  --welcome-hero-bg:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.18)),
    linear-gradient(180deg, rgba(85, 102, 120, 0.35), rgba(8, 11, 18, 0.82));
  --welcome-hero-border: rgba(255, 255, 255, 0.08);
  --welcome-hero-overlay:
    radial-gradient(circle at 50% 16%, rgba(255, 240, 204, 0.18), transparent 12%),
    radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08), transparent 7%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(2, 6, 12, 0.22));
  --welcome-art-bg:
    radial-gradient(circle at 50% 14%, rgba(255, 255, 255, 0.24), transparent 9%),
    radial-gradient(circle at 82% 30%, rgba(16, 24, 40, 0.3), transparent 18%),
    radial-gradient(circle at 15% 40%, rgba(16, 24, 40, 0.34), transparent 22%);
  --welcome-eyebrow-border: rgba(255, 255, 255, 0.14);
  --welcome-eyebrow-bg: rgba(255, 255, 255, 0.08);
  --welcome-eyebrow-color: rgba(248, 250, 252, 0.82);
  --welcome-headline-color: #ffffff;
  --welcome-desc-color: rgba(226, 232, 240, 0.82);
  --welcome-composer-bg: rgba(40, 43, 52, 0.84);
  --welcome-composer-border: rgba(255, 255, 255, 0.08);
  --welcome-composer-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
  --welcome-textarea-color: #f8fafc;
  --welcome-placeholder-color: rgba(226, 232, 240, 0.5);
  --welcome-send-bg: rgba(255, 255, 255, 0.16);
  --welcome-send-bg-hover: rgba(255, 255, 255, 0.26);
  --welcome-send-color: #ffffff;
  --preview-surface-color: rgba(255, 255, 255, 0.75);
  --preview-surface-bg:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 45%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  --preview-surface-border: rgba(255, 255, 255, 0.08);
  --preview-surface-grid: rgba(255, 255, 255, 0.09);
  --preview-surface-orb-color: rgba(255, 255, 255, 0.82);
  --preview-surface-orb-bg: rgba(255, 255, 255, 0.04);
  --preview-surface-ring: rgba(129, 140, 248, 0.3);
  --preview-surface-title: rgba(255, 255, 255, 0.96);
  --preview-surface-text: rgba(255, 255, 255, 0.62);
  --preview-surface-tip-text: #d1d5db;
  --preview-surface-tip-bg: rgba(255, 255, 255, 0.04);
  --preview-surface-tip-border: rgba(255, 255, 255, 0.08);
  --preview-strip-bg: rgba(255, 255, 255, 0.03);
  --preview-strip-border: rgba(255, 255, 255, 0.08);
  --preview-strip-title: rgba(255, 255, 255, 0.94);
  --preview-strip-text: rgba(255, 255, 255, 0.56);
  --preview-strip-chip-bg: transparent;
  --preview-strip-chip-border: rgba(255, 255, 255, 0.08);
  --preview-strip-chip-text: rgba(255, 255, 255, 0.8);
}

.history-sidebar {
  width: 64px;
  flex-shrink: 0;
  height: 100%;
  background: var(--workshop-panel-strong-bg);
  border-right: 1px solid var(--workshop-border);
  display: flex;
  flex-direction: column;
  padding: 16px 12px 18px;
  overflow: hidden;
  transition: width 0.28s ease, padding 0.28s ease;
}

.history-sidebar.expanded {
  width: 280px;
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
  color: var(--text-primary);
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
  color: var(--text-secondary);
}

.sidebar-action-icon {
  width: 28px;
  text-align: center;
  font-size: 1.2rem;
}

.sidebar-user-card {
  padding: 12px 14px;
  border-radius: 18px;
  background: var(--workshop-panel-bg);
  border: 1px solid var(--workshop-border);
}

.sidebar-user-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.sidebar-user-name {
  margin-top: 6px;
  font-size: 0.98rem;
  color: var(--text-primary);
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
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.sidebar-conversation-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.sidebar-conversation-item {
  display: flex;
  align-items: stretch;
  border-radius: 14px;
  overflow: hidden;
  background: var(--workshop-panel-bg);
  border: 1px solid transparent;
}

.sidebar-conversation-item.active {
  background: var(--workshop-hover-bg);
  border-color: var(--workshop-border);
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
  padding: 12px 14px;
}

.sidebar-conversation-input {
  width: 100%;
  margin: 10px 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--workshop-input-border);
  background: var(--workshop-input-bg);
  color: var(--text-primary);
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
  font-size: 0.9rem;
  color: var(--text-primary);
}

.sidebar-conversation-time {
  margin-top: 4px;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.sidebar-conversation-edit,
.sidebar-conversation-delete {
  width: 34px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-conversation-edit:hover,
.sidebar-conversation-delete:hover {
  background: var(--workshop-hover-bg);
  color: var(--text-primary);
}

.mobile-sidebar-mask {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(3, 6, 18, 0.58);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.mobile-pane-switch {
  display: none;
}

.sidebar-conversation-empty {
  padding: 16px 12px;
  border-radius: 14px;
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
  background: var(--workshop-panel-bg);
}

.sidebar-conversation-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
}

.sidebar-page-btn {
  min-width: 64px;
  border: 1px solid var(--workshop-border);
  border-radius: 999px;
  background: var(--workshop-panel-bg);
  color: var(--text-primary);
  padding: 6px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
}

.sidebar-page-btn:hover:not(:disabled) {
  background: var(--workshop-hover-bg);
  border-color: var(--workshop-input-border);
}

.sidebar-page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.sidebar-page-indicator {
  font-size: 0.74rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
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
  background: var(--workshop-border);
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

.chat-panel--welcome {
  flex: 1;
  width: 100%;
}

.chat-panel--welcome .welcome-screen {
  position: static;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.welcome-screen__panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 22px 18px 18px;
  border-radius: 30px;
  overflow: hidden;
  background: var(--welcome-panel-bg);
  box-shadow: var(--welcome-panel-shadow);
}

.welcome-screen__meta {
  padding: 4px 4px 18px;
  color: var(--welcome-meta-color);
}

.welcome-screen__title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.welcome-screen__menu-btn {
  flex-shrink: 0;
}

.welcome-screen__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--welcome-title-color);
}

.welcome-screen__subtitle {
  margin-top: 8px;
  font-size: 0.82rem;
  color: var(--welcome-subtitle-color);
}

.welcome-screen__hero {
  flex: 1;
  min-height: 0;
  padding: 28px 22px;
  border-radius: 28px;
  background: var(--welcome-hero-bg);
  border: 1px solid var(--welcome-hero-border);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.welcome-screen__hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--welcome-hero-overlay);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.welcome-screen__art {
  position: absolute;
  inset: 0;
  background: var(--welcome-art-bg);
  opacity: 0.85;
}

.welcome-screen__copy {
  position: relative;
  z-index: 1;
  width: min(560px, 100%);
  min-width: 0;
  padding: 24px 22px;
}

.welcome-screen__eyebrow {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 15px;
  border-radius: 999px;
  border: 1px solid var(--welcome-eyebrow-border);
  background: var(--welcome-eyebrow-bg);
  color: var(--welcome-eyebrow-color);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-screen__headline {
  margin-top: 26px;
  color: var(--welcome-headline-color);
  font-size: clamp(2.3rem, 5vw, 3.9rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.welcome-screen__desc {
  margin-top: 18px;
  max-width: 520px;
  color: var(--welcome-desc-color);
  font-size: 1.08rem;
  line-height: 1.75;
}

.welcome-screen__composer {
  margin-top: 14px;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 24px;
  background: var(--welcome-composer-bg);
  border: 1px solid var(--welcome-composer-border);
  box-shadow: var(--welcome-composer-shadow);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.welcome-screen__textarea {
  flex: 1;
  min-height: 56px;
  padding: 14px 16px;
  border: none;
  resize: none;
  outline: none;
  background: transparent;
  color: var(--welcome-textarea-color);
  font-size: 1rem;
  line-height: 1.6;
  font-family: inherit;
}

.welcome-screen__textarea::placeholder {
  color: var(--welcome-placeholder-color);
}

.welcome-screen__actions {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.mode-switch--welcome {
  margin-right: 0;
}

.welcome-screen__send {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--welcome-send-bg);
  color: var(--welcome-send-color);
  cursor: pointer;
  transition: background 0.16s ease, transform 0.16s ease, opacity 0.16s ease;
}

.welcome-screen__send:hover:not(:disabled) {
  background: var(--welcome-send-bg-hover);
  transform: translateY(-1px);
}

.welcome-screen__send:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.attachment-btn {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--bg-glass-border, rgba(255,255,255,0.12));
  background: var(--bg-card, rgba(255,255,255,0.06));
  color: var(--text-primary, #e8e8f0);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.16s ease, border-color 0.16s ease, opacity 0.16s ease;
}

.attachment-btn:hover:not(:disabled) {
  background: var(--workshop-hover-bg, rgba(255,255,255,0.08));
  border-color: rgba(99, 102, 241, 0.28);
}

.attachment-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.attachment-btn--welcome {
  height: 44px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #0f172a;
  border-color: rgba(148, 163, 184, 0.28);
}

.attachment-btn--welcome:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.94);
}

.skill-attachment-input {
  display: none;
}

.skill-attachment-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.skill-attachment-panel--chat {
  padding: 0 16px 12px;
  margin-top: 0;
}

.skill-attachment-panel__error {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.22);
  background: rgba(127, 29, 29, 0.16);
  color: #fecaca;
  font-size: 0.8rem;
}

.skill-attachment-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-attachment-group__title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary, #94a3b8);
}

.skill-attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-attachment-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  max-width: min(100%, 320px);
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.12);
}

.skill-attachment-chip__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.skill-attachment-chip__name,
.skill-attachment-chip__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-attachment-chip__name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary, #f8fafc);
}

.skill-attachment-chip__meta {
  font-size: 0.72rem;
  color: var(--text-secondary, #94a3b8);
}

.skill-attachment-chip__remove {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.22);
  color: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.skill-attachment-chip__remove:hover {
  background: rgba(239, 68, 68, 0.2);
}

.skill-attachment-chip--pending {
  border-color: rgba(96, 165, 250, 0.22);
  background: rgba(30, 64, 175, 0.12);
}

.skill-attachment-chip--success {
  border-color: rgba(34, 197, 94, 0.22);
  background: rgba(21, 128, 61, 0.12);
}

.skill-attachment-chip--empty {
  border-color: rgba(245, 158, 11, 0.22);
  background: rgba(180, 83, 9, 0.12);
}

.skill-attachment-chip--failed {
  border-color: rgba(239, 68, 68, 0.24);
  background: rgba(127, 29, 29, 0.16);
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--workshop-border);
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
.chat-title-input {
  min-width: 0;
  width: min(320px, 100%);
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--topbar-border);
  background: var(--workshop-panel-bg);
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  outline: none;
}
.chat-title-input:focus {
  border-color: var(--accent, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.16);
}
.chat-title { font-weight: 600; font-size: 0.95rem; }
.title-edit-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  background: var(--workshop-panel-bg);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.title-edit-btn:hover {
  background: var(--workshop-hover-bg);
  color: var(--text-primary);
}
.chat-subtitle {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 0.8rem;
}
.header-actions { display: flex; gap: 6px; }
.icon-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text-secondary); padding: 5px; border-radius: 6px;
  display: flex; align-items: center;
}
.icon-btn:hover { background: var(--workshop-hover-bg); color: var(--text-primary); }
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
.empty-hint { text-align: center; color: var(--text-secondary); margin-top: 60px; font-size: 0.9rem; }

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

/* VMarkdownView 鍦ㄧ传鑹叉皵娉″唴锛氬己鍒舵祬鑹插瓧锛岄伩鍏?dark 涓婚涓庤儗鏅啿绐?*/
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

/* 流式 HTML：加宽并压低高度，控制在一屏内的短条预览 */
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

/* 生成结束后继续展示源码，尺寸与流式区域保持一致 */
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

.send-btn {
  height: 36px; border-radius: 9px; border: none;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s;
}
.send-btn { width: 36px; }
.send-btn { background: var(--accent, #6366f1); color: #fff; }
.send-btn:hover:not(:disabled) { background: #4f46e5; }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.mode-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 42px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
.mode-switch__option {
  min-width: 84px;
  height: 100%;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-secondary, #9ca3af);
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}
.mode-switch__option:hover {
  color: var(--text-primary, #f3f4f6);
  background: rgba(255,255,255,0.06);
}
.mode-switch__option--active {
  background: linear-gradient(180deg, rgba(99,102,241,0.28), rgba(79,70,229,0.22));
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(165,180,252,0.32), 0 6px 16px rgba(79,70,229,0.18);
}
.mode-switch__label {
  font-size: 0.78rem;
  line-height: 1;
}
.mode-switch__hint {
  font-size: 0.64rem;
  line-height: 1;
  color: rgba(255,255,255,0.58);
}
.mode-switch__option--active .mode-switch__hint {
  color: rgba(255,255,255,0.84);
}

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
  border-bottom: 1px solid var(--workshop-border);
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
    linear-gradient(180deg, var(--workshop-panel-bg), rgba(255,255,255,0)),
    var(--workshop-panel-soft-bg);
}

.workspace-browser {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--workshop-border);
  background: var(--workshop-inset-bg);
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
  border-bottom: 1px solid var(--workshop-border);
}

.workspace-browser-title {
  font-size: 0.92rem;
  font-weight: 700;
}

.workspace-browser-subtitle {
  margin-top: 4px;
  font-size: 0.76rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.workspace-refresh-btn {
  border: 1px solid var(--workshop-border);
  background: var(--workshop-panel-bg);
  color: var(--text-primary);
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
  color: var(--text-secondary);
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
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.16s ease, color 0.16s ease;
}

.workspace-tree-node:hover {
  background: var(--workshop-hover-bg);
}

.workspace-tree-node.is-selected {
  background: rgba(99,102,241,0.16);
  color: var(--text-primary);
}

.workspace-tree-caret {
  width: 12px;
  min-width: 12px;
  color: var(--text-muted);
}

.workspace-tree-caret svg {
  transition: transform 0.16s ease;
}

.workspace-tree-caret svg.open {
  transform: rotate(90deg);
}

.workspace-tree-icon {
  min-width: 42px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
  flex-shrink: 0;
}

.workspace-tree-label {
  flex: 1;
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
  border-bottom: 1px solid var(--workshop-border);
  background: var(--workshop-panel-bg);
  flex-shrink: 0;
}

.results-tab {
  border: 1px solid var(--workshop-border);
  background: var(--workshop-panel-bg);
  color: var(--text-secondary);
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
  color: var(--text-primary);
  background: var(--workshop-hover-strong-bg);
  border-color: var(--workshop-input-border);
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
  color: var(--preview-surface-color);
  background: var(--preview-surface-bg);
  border: 1px solid var(--preview-surface-border);
  position: relative;
  overflow: hidden;
}

.preview-waiting-shell.is-busy::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--preview-surface-grid) 1px, transparent 1px);
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
  color: var(--preview-surface-orb-color);
  background: var(--preview-surface-orb-bg);
  position: relative;
}

.preview-waiting-ring {
  position: absolute;
  inset: 10px;
  border-radius: 22px;
  border: 1px solid var(--preview-surface-ring);
}

.preview-waiting-title {
  font-size: 1.08rem;
  font-weight: 700;
  color: var(--preview-surface-title);
}

.preview-waiting-text {
  margin: 10px auto 0;
  max-width: 420px;
  line-height: 1.65;
  font-size: 0.9rem;
  color: var(--preview-surface-text);
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
  color: var(--preview-surface-tip-text);
  border: 1px solid var(--preview-surface-tip-border);
  background: var(--preview-surface-tip-bg);
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
  background: var(--preview-strip-bg);
  border-bottom: 1px solid var(--preview-strip-border);
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
  border-bottom: 1px solid var(--preview-strip-border);
  background: var(--preview-strip-bg);
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
  background: color-mix(in srgb, var(--preview-strip-text) 55%, transparent);
}

.preview-status-title {
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--preview-strip-title);
}

.preview-status-subtitle {
  margin-top: 3px;
  font-size: 0.75rem;
  color: var(--preview-strip-text);
}

.preview-status-chip {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  border: 1px solid var(--preview-strip-chip-border);
  background: var(--preview-strip-chip-bg);
  color: var(--preview-strip-chip-text);
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
  background: var(--preview-strip-bg);
  border-bottom: 1px solid var(--preview-strip-border);
  flex-shrink: 0;
  color: var(--preview-strip-text);
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

/* Stream status bar (sticky top) */
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

/* Scroll to bottom button */
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

/* Agent-Do timer in header */
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

/* Agent-Do progress bar */
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
  background: var(--workshop-hover-bg);
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

  .welcome-screen {
    padding: 18px;
  }

  .welcome-screen__panel {
    padding: 20px 16px 16px;
    border-radius: 24px;
  }

  .welcome-screen__hero {
    padding: 22px 16px;
    border-radius: 24px;
  }

  .welcome-screen__copy {
    padding: 16px 14px;
  }
}

@media (max-width: 768px) {
  .workshop {
    min-height: 0;
    height: 100dvh;
    border-radius: 0;
    position: relative;
  }

  .workspace-main {
    flex-direction: column;
    min-height: 0;
  }

  .history-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(84vw, 320px);
    padding: 14px 14px 18px;
    transform: translateX(-100%);
    box-shadow: 0 18px 42px rgba(0,0,0,0.42);
    z-index: 60;
  }

  .history-sidebar.is-mobile-open,
  .history-sidebar.expanded {
    width: min(84vw, 320px);
    padding: 14px 14px 18px;
    transform: translateX(0);
  }

  .sidebar-top {
    flex-direction: row;
    justify-content: space-between;
  }

  .sidebar-brand {
    font-size: 1.55rem;
  }

  .mobile-pane-switch {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--workshop-border);
    background: var(--workshop-panel-strong-bg);
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .mobile-pane-switch__btn {
    flex: 1;
    border: 1px solid var(--workshop-border);
    background: var(--workshop-panel-bg);
    color: var(--text-secondary);
    border-radius: 11px;
    padding: 10px 12px;
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
  }

  .mobile-pane-switch__btn.active {
    background: rgba(99,102,241,0.18);
    border-color: rgba(99,102,241,0.34);
    color: var(--text-primary);
  }

  .chat-panel,
  .results-panel {
    width: 100% !important;
    flex: 1;
    min-height: 0;
  }

  .divider {
    display: none;
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

  .welcome-screen {
    padding: 12px;
  }

  .welcome-screen__panel {
    padding: 16px 14px 14px;
    border-radius: 24px;
  }

  .welcome-screen__hero {
    padding: 18px 14px;
    border-radius: 22px;
  }

  .welcome-screen__copy {
    padding: 12px 10px;
  }

  .welcome-screen__headline {
    margin-top: 18px;
    font-size: 2.5rem;
  }

  .welcome-screen__desc {
    font-size: 0.95rem;
  }

  .welcome-screen__composer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 20px;
  }

  .welcome-screen__textarea {
    min-height: 48px;
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  .welcome-screen__actions {
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .attachment-btn {
    width: 100%;
    justify-content: center;
  }

  .skill-attachment-chip {
    max-width: 100%;
  }

  .results-content {
    flex-direction: column;
  }

  .workspace-browser {
    width: 100%;
    max-height: 42vh;
    border-right: none;
    border-bottom: 1px solid var(--workshop-border);
  }

  .mode-switch--welcome {
    flex: 1;
  }

  .welcome-screen__send {
    width: 44px;
    height: 44px;
    border-radius: 999px;
  }
}

@media (max-width: 420px) {
  .welcome-screen__headline {
    font-size: 2.1rem;
  }

  .welcome-screen__copy {
    width: 100%;
    padding: 8px 6px;
  }

  .welcome-screen__desc {
    max-width: none;
    font-size: 0.9rem;
  }

  .mode-switch__option {
    min-width: 76px;
    padding-inline: 10px;
  }

  /* [容器池功能暂时禁用]
  .sandbox-pool-grid {
    grid-template-columns: 1fr;
  }
  */
}
</style>

