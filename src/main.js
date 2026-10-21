// ==========================================================================
// STASHY CONTROLLER
// Pixel-accurate implementation of STIKI desktop application
// ==========================================================================

const isTauri = typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

async function tauriInvoke(cmd, args = {}) {
  if (isTauri && window.__TAURI__?.core?.invoke) {
    try {
      return await window.__TAURI__.core.invoke(cmd, args);
    } catch (e) {
      console.warn(`Tauri invoke '${cmd}' failed, fallback to local engine:`, e);
    }
  }
  return fallbackInvoke(cmd, args);
}

// --------------------------------------------------------------------------
// STORAGE KEYS & DEFAULT SEED DATA
// --------------------------------------------------------------------------
const STORAGE_KEY = 'stashy_notes_v3';
const SETTINGS_KEY = 'stashy_settings_v3';

const DEFAULT_LABELS = {
  yellow: 'In Progress',
  green: 'Almost There',
  purple: 'You can do it.',
  blue: 'Next Steps',
  red: 'FAAAAAAH',
  dark: 'CLI / Terminal'
};

const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Release',
    color: 'green',
    pinned: true,
    content: `name: Release\non:\n  push:\n    tags:\n      - "v*"\n  permissions: write\n\njobs:\n  release:\n    strategy:\n      fail-fast: false\n      # tauri-action merges platform...`,
    updated_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-2',
    title: 'Sync Note Tag',
    color: 'purple',
    pinned: false,
    content: `This is to check the sync.`,
    updated_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-3',
    title: 'Work Done',
    color: 'blue',
    pinned: false,
    content: `- [ ] almost there.`,
    updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-4',
    title: 'This is my crazy note.',
    color: 'blue',
    pinned: false,
    content: `- [ ] This is checkbox 1.\n- [x] this is complete`,
    hasImage: true,
    updated_at: new Date(Date.now() - 9 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-5',
    title: 'Reddit reply',
    color: 'green',
    pinned: false,
    content: `That's great to hear. And you know what? There is nothing wrong with having contacts in those organizations who are using it. At first blush, I took it to say these companies are supporting this project, and that's what has given me pause. I have downloaded the app in a virtual environment as a precaution, and honestly, I do like it. There are some small tweaks that I'm taking notes on that I'll forward, but I do want to say...`,
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-6',
    title: 'Embeddings',
    color: 'red',
    pinned: false,
    content: `- Async functions required.\nVector embeddings and ultra fast retrieval on disk.`,
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-7',
    title: 'New note',
    color: 'red',
    pinned: false,
    content: `https://dakshsharma.me`,
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-8',
    title: 'CI Pipeline',
    color: 'blue',
    pinned: false,
    content: `Needs triage`,
    updated_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    archived: false
  }
];

// --------------------------------------------------------------------------
// APPLICATION STATE
// --------------------------------------------------------------------------
let notes = [];
let settings = {
  dock_position: 'right-top',
  labels: { ...DEFAULT_LABELS },
  font: 'font-handwritten',
  layout: 'grid',
  activeView: 'all-notes'
};

let activeNoteId = null;
let currentFilter = 'all';
let searchQuery = '';
let saveTimeout = null;

// Pomodoro Timer State
let pomoTimerInterval = null;
let pomoMode = 'timer'; // 'timer' | 'stopwatch'
let pomoIsRunning = false;
let pomoSecondsLeft = 25 * 60;
let pomoCurrentSession = 1;

// Stopwatch State
let stopwatchInterval = null;
let stopwatchIsRunning = false;
let stopwatchMs = 0;

// --------------------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  initDomElements();
  setupEventListeners();
  applyDockPosition(settings.dock_position);
  applyFont(settings.font);
  updateLabelsDisplay();
  renderAllViews();
});

function loadLocalState() {
  try {
    const rawNotes = localStorage.getItem(STORAGE_KEY);
    notes = rawNotes ? JSON.parse(rawNotes) : INITIAL_NOTES;
  } catch (e) {
    notes = INITIAL_NOTES;
  }

  try {
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      settings = { ...settings, ...JSON.parse(rawSettings) };
      settings.labels = { ...DEFAULT_LABELS, ...(settings.labels || {}) };
    }
  } catch (e) {}
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

// --------------------------------------------------------------------------
// DOM ELEMENTS REFERENCE
// --------------------------------------------------------------------------
let dom = {};

function initDomElements() {
  dom = {
    // Dock
    edgeDock: document.getElementById('edgeDock'),
    dockMenuToggle: document.getElementById('dockMenuToggle'),
    dockTabsStack: document.getElementById('dockTabsStack'),
    dockQuickAddBtn: document.getElementById('dockQuickAddBtn'),
    dockScrollDownBtn: document.getElementById('dockScrollDownBtn'),

    // Board Window
    boardWindow: document.getElementById('boardWindow'),
    winMinBtn: document.getElementById('winMinBtn'),
    winMaxBtn: document.getElementById('winMaxBtn'),
    winCloseBtn: document.getElementById('winCloseBtn'),
    crumbHomeLink: document.getElementById('crumbHomeLink'),
    crumbCurrentView: document.getElementById('crumbCurrentView'),

    // Sidebar
    brandHomeBtn: document.getElementById('brandHomeBtn'),
    customNavToggle: document.getElementById('customNavToggle'),
    customNavList: document.getElementById('customNavList'),
    sidebarAddNoteBtn: document.getElementById('sidebarAddNoteBtn'),
    navItems: document.querySelectorAll('.nav-item'),

    // Views
    viewPanels: document.querySelectorAll('.view-panel'),
    notesGrid: document.getElementById('notesGrid'),
    notesList: document.getElementById('notesList'),
    archivedNotesContainer: document.getElementById('archivedNotesContainer'),
    archivedEmptyState: document.getElementById('archivedEmptyState'),

    // Toolbar
    boardSearchInput: document.getElementById('boardSearchInput'),
    filterBtn: document.getElementById('filterBtn'),
    filterMenu: document.getElementById('filterMenu'),
    viewListBtn: document.getElementById('viewListBtn'),
    viewGridBtn: document.getElementById('viewGridBtn'),

    // Note Editor Flyout
    editorBackdrop: document.getElementById('editorBackdrop'),
    editorCard: document.getElementById('editorCard'),
    editorPinBtn: document.getElementById('editorPinBtn'),
    editorTitleInput: document.getElementById('editorTitleInput'),
    editorContentInput: document.getElementById('editorContentInput'),
    editorHighlightBackdrop: document.getElementById('editorHighlightBackdrop'),
    editorSaveStatus: document.getElementById('editorSaveStatus'),
    editorDeleteBtn: document.getElementById('editorDeleteBtn'),
    editorCloseBtn: document.getElementById('editorCloseBtn'),
    editorCompactBtn: document.getElementById('editorCompactBtn'),
    editorResizeHandle: document.getElementById('editorResizeHandle'),
    swatches: document.querySelectorAll('.swatch-circle'),

    // Pomodoro Elements
    pomoModeTimerBtn: document.getElementById('pomoModeTimerBtn'),
    pomoModeStopwatchBtn: document.getElementById('pomoModeStopwatchBtn'),
    pomoTimerContainer: document.getElementById('pomoTimerContainer'),
    pomoStopwatchContainer: document.getElementById('pomoStopwatchContainer'),
    pomoMainClock: document.getElementById('pomoMainClock'),
    pomoTogglePlayBtn: document.getElementById('pomoTogglePlayBtn'),
    pomoPlayIcon: document.getElementById('pomoPlayIcon'),
    pomoPauseIcon: document.getElementById('pomoPauseIcon'),
    pomoFocusInput: document.getElementById('pomoFocusInput'),
    pomoBreakInput: document.getElementById('pomoBreakInput'),
    pomoSessionsInput: document.getElementById('pomoSessionsInput'),
    pomoSessionFooterText: document.getElementById('pomoSessionFooterText'),

    // Stopwatch Elements
    stopwatchClock: document.getElementById('stopwatchClock'),
    stopwatchToggleBtn: document.getElementById('stopwatchToggleBtn'),
    stopwatchPlayIcon: document.getElementById('stopwatchPlayIcon'),
    stopwatchPauseIcon: document.getElementById('stopwatchPauseIcon'),
    stopwatchResetBtn: document.getElementById('stopwatchResetBtn'),
    stopwatchStatusText: document.getElementById('stopwatchStatusText'),

    // Set Labels Inputs
    labelInputYellow: document.getElementById('labelInputYellow'),
    labelInputGreen: document.getElementById('labelInputGreen'),
    labelInputPurple: document.getElementById('labelInputPurple'),
    labelInputBlue: document.getElementById('labelInputBlue'),
    labelInputRed: document.getElementById('labelInputRed'),
    labelInputDark: document.getElementById('labelInputDark'),

    // Dock Position Monitors
    monitorCards: document.querySelectorAll('.monitor-card'),

    // Font Choice Cards
    fontChoiceCards: document.querySelectorAll('.font-choice-card')
  };
}

// --------------------------------------------------------------------------
// EVENT LISTENERS SETUP
// --------------------------------------------------------------------------
function setupEventListeners() {
  // Toggle Board Window from Dock Handle
  dom.dockMenuToggle.addEventListener('click', () => {
    dom.boardWindow.classList.toggle('hidden');
  });

  // Quick Add (+) Button on Dock
  dom.dockQuickAddBtn.addEventListener('click', () => {
    createNewNote();
  });

  // Sidebar Add Note Button
  dom.sidebarAddNoteBtn.addEventListener('click', () => {
    createNewNote();
  });

  // Window Controls
  dom.winCloseBtn.addEventListener('click', () => dom.boardWindow.classList.add('hidden'));
  dom.winMinBtn.addEventListener('click', () => dom.boardWindow.classList.add('hidden'));
  dom.winMaxBtn.addEventListener('click', () => {
    dom.boardWindow.classList.toggle('maximized');
  });

  // Navigation Links
  dom.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  dom.brandHomeBtn.addEventListener('click', () => switchView('all-notes'));
  dom.crumbHomeLink.addEventListener('click', () => switchView('all-notes'));

  // Collapsible Custom Menu
  dom.customNavToggle.addEventListener('click', () => {
    dom.customNavList.classList.toggle('hidden');
    dom.customNavToggle.querySelector('.chevron-arrow').classList.toggle('collapsed');
  });

  // View Layout Switcher (Grid vs List)
  dom.viewGridBtn.addEventListener('click', () => setLayout('grid'));
  dom.viewListBtn.addEventListener('click', () => setLayout('list'));

  // Filter Menu
  dom.filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.filterMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dom.filterMenu.classList.add('hidden');
  });

  dom.filterMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.filterMenu.querySelectorAll('.dropdown-item').forEach(b => b.classList.remove('active'));
      item.classList.add('active');
      currentFilter = item.getAttribute('data-filter');
      dom.filterMenu.classList.add('hidden');
      renderNotesGridAndList();
    });
  });

  // Search input
  dom.boardSearchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderNotesGridAndList();
  });

  // Note Flyout Swatches
  dom.swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.getAttribute('data-color');
      setNoteColor(color);
    });
  });

  // Note Flyout Inputs Auto-save & Syntax Highlighting
  dom.editorTitleInput.addEventListener('input', triggerAutoSave);
  dom.editorContentInput.addEventListener('input', () => {
    updateEditorSyntaxHighlight();
    triggerAutoSave();
  });
  dom.editorContentInput.addEventListener('scroll', () => {
    if (dom.editorHighlightBackdrop) {
      dom.editorHighlightBackdrop.scrollTop = dom.editorContentInput.scrollTop;
      dom.editorHighlightBackdrop.scrollLeft = dom.editorContentInput.scrollLeft;
    }
  });

  // Note Flyout Close & Delete
  dom.editorCloseBtn.addEventListener('click', closeEditor);
  dom.editorDeleteBtn.addEventListener('click', () => {
    if (activeNoteId) {
      deleteNote(activeNoteId);
      closeEditor();
    }
  });

  // Note Flyout Pin Toggle
  dom.editorPinBtn.addEventListener('click', () => {
    if (activeNoteId) {
      const note = notes.find(n => n.id === activeNoteId);
      if (note) {
        note.pinned = !note.pinned;
        dom.editorPinBtn.style.opacity = note.pinned ? '1' : '0.5';
        persistState();
        renderDockTabs();
      }
    }
  });

  // Pomodoro Mode Toggle
  dom.pomoModeTimerBtn.addEventListener('click', () => setPomoMode('timer'));
  dom.pomoModeStopwatchBtn.addEventListener('click', () => setPomoMode('stopwatch'));

  // Pomodoro Controls
  dom.pomoTogglePlayBtn.addEventListener('click', togglePomoPlay);
  dom.pomoFocusInput.addEventListener('change', () => {
    if (!pomoIsRunning) {
      pomoSecondsLeft = parseInt(dom.pomoFocusInput.value, 10) * 60;
      updatePomoClockDisplay();
    }
  });

  // Stopwatch Controls
  dom.stopwatchToggleBtn.addEventListener('click', toggleStopwatch);
  dom.stopwatchResetBtn.addEventListener('click', resetStopwatch);

  // Set Labels Inputs
  [
    { input: dom.labelInputYellow, color: 'yellow' },
    { input: dom.labelInputGreen, color: 'green' },
    { input: dom.labelInputPurple, color: 'purple' },
    { input: dom.labelInputBlue, color: 'blue' },
    { input: dom.labelInputRed, color: 'red' },
    { input: dom.labelInputDark, color: 'dark' }
  ].forEach(({ input, color }) => {
    input.addEventListener('input', () => {
      settings.labels[color] = input.value.trim();
      persistState();
      updateLabelsDisplay();
      renderNotesGridAndList();
    });
  });

  // Dock Position Monitors
  dom.monitorCards.forEach(card => {
    card.addEventListener('click', () => {
      const pos = card.getAttribute('data-pos');
      applyDockPosition(pos);
      dom.monitorCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Font Choice Cards
  dom.fontChoiceCards.forEach(card => {
    card.addEventListener('click', () => {
      const font = card.getAttribute('data-font');
      applyFont(font);
      dom.fontChoiceCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Escape key closes editor
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dom.editorBackdrop.classList.contains('hidden')) {
      closeEditor();
    }
  });

  // Dynamic moving & resizing of note card
  setupEditorDragAndResize();
}

// --------------------------------------------------------------------------
// VIEW NAVIGATION
// --------------------------------------------------------------------------
function switchView(viewName) {
  settings.activeView = viewName;
  dom.navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  dom.viewPanels.forEach(panel => panel.classList.remove('active'));

  const viewMap = {
    'all-notes': 'viewAllNotes',
    'archived': 'viewArchived',
    'pomodoro': 'viewPomodoro',
    'dock-position': 'viewDockPosition',
    'license': 'viewLicense',
    'sync': 'viewSync',
    'set-labels': 'viewSetLabels',
    'font': 'viewFont',
    'contact': 'viewContact'
  };

  const titles = {
    'all-notes': 'All notes',
    'archived': 'Archived',
    'pomodoro': 'Pomodoro',
    'dock-position': 'Dock position',
    'license': 'License',
    'sync': 'Sync',
    'set-labels': 'Set labels',
    'font': 'Font',
    'contact': 'Contact'
  };

  const targetPanelId = viewMap[viewName] || 'viewAllNotes';
  const targetPanel = document.getElementById(targetPanelId);
  if (targetPanel) targetPanel.classList.add('active');

  dom.crumbCurrentView.textContent = titles[viewName] || 'All notes';

  if (viewName === 'archived') {
    renderArchivedNotes();
  }
}

function setLayout(layout) {
  settings.layout = layout;
  if (layout === 'grid') {
    dom.viewGridBtn.classList.add('active');
    dom.viewListBtn.classList.remove('active');
    dom.notesGrid.classList.remove('hidden');
    dom.notesList.classList.add('hidden');
  } else {
    dom.viewListBtn.classList.add('active');
    dom.viewGridBtn.classList.remove('active');
    dom.notesGrid.classList.add('hidden');
    dom.notesList.classList.remove('hidden');
  }
  persistState();
}

// --------------------------------------------------------------------------
// DOCK POSITION & FONT STYLES
// --------------------------------------------------------------------------
function applyDockPosition(pos) {
  settings.dock_position = pos;
  document.body.className = document.body.className.replace(/dock-edge-[a-z-]+/g, '').trim();
  document.body.classList.add(`dock-edge-${pos}`);
  persistState();
}

function applyFont(font) {
  settings.font = font;
  document.body.className = document.body.className.replace(/font-[a-z-]+/g, '').trim();
  document.body.classList.add(font);
  dom.editorCard.className = dom.editorCard.className.replace(/font-[a-z-]+/g, '').trim();
  dom.editorCard.classList.add(font);
  persistState();
  renderNotesGridAndList();
  updateEditorSyntaxHighlight();
}

function updateLabelsDisplay() {
  const lbls = settings.labels;
  dom.labelInputYellow.value = lbls.yellow || '';
  dom.labelInputGreen.value = lbls.green || '';
  dom.labelInputPurple.value = lbls.purple || '';
  dom.labelInputBlue.value = lbls.blue || '';
  dom.labelInputRed.value = lbls.red || '';
  if (dom.labelInputDark) dom.labelInputDark.value = lbls.dark || '';

  // Update filter dropdown labels
  const filterYellow = document.querySelector('.filter-lbl-yellow');
  if (filterYellow) filterYellow.textContent = lbls.yellow;
  const filterGreen = document.querySelector('.filter-lbl-green');
  if (filterGreen) filterGreen.textContent = lbls.green;
  const filterPurple = document.querySelector('.filter-lbl-purple');
  if (filterPurple) filterPurple.textContent = lbls.purple;
  const filterBlue = document.querySelector('.filter-lbl-blue');
  if (filterBlue) filterBlue.textContent = lbls.blue;
  const filterRed = document.querySelector('.filter-lbl-red');
  if (filterRed) filterRed.textContent = lbls.red;
  const filterDark = document.querySelector('.filter-lbl-dark');
  if (filterDark) filterDark.textContent = lbls.dark;
}

// --------------------------------------------------------------------------
// RENDERING
// --------------------------------------------------------------------------
function renderAllViews() {
  renderDockTabs();
  renderNotesGridAndList();
  renderArchivedNotes();
}

function renderDockTabs() {
  dom.dockTabsStack.innerHTML = '';
  // Show active, unarchived notes as tabs
  const activeNotes = notes.filter(n => !n.archived);

  activeNotes.forEach(note => {
    const tab = document.createElement('div');
    tab.className = `dock-edge-tab dock-tab-${note.color} ${activeNoteId === note.id ? 'active' : ''}`;
    
    // Truncate uppercase title like RELEA..., SYNC ...
    const titleSnippet = (note.title || 'UNTITLED').toUpperCase().slice(0, 5);
    tab.textContent = `${titleSnippet}...`;
    tab.title = note.title;

    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditor(note.id);
    });

    dom.dockTabsStack.appendChild(tab);
  });
}

function renderNotesGridAndList() {
  dom.notesGrid.innerHTML = '';
  dom.notesList.innerHTML = '';

  const activeNotes = notes.filter(n => !n.archived);

  // Apply filters & search
  const filtered = activeNotes.filter(n => {
    const matchFilter = currentFilter === 'all' || n.color === currentFilter;
    const matchSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery) || 
      n.content.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });

  filtered.forEach(note => {
    // 1. Grid Card
    const card = createNoteCardElement(note);
    dom.notesGrid.appendChild(card);

    // 2. List Row (Frame 8)
    const row = createNoteListRowElement(note);
    dom.notesList.appendChild(row);
  });
}

function createNoteCardElement(note) {
  const card = document.createElement('article');
  card.className = `note-card-item card-${note.color}`;

  const labelText = settings.labels[note.color] || '';
  const timeText = formatRelativeTime(note.updated_at);
  const isMono = settings.font === 'font-mono' || note.font === 'font-mono';
  const formattedContent = parseMarkdownChecklists(note.content, isMono);

  card.innerHTML = `
    <div class="card-top-bar">
      <div class="card-top-left">
        <span class="card-timestamp">${timeText}</span>
        ${labelText ? `<span class="card-tag-pill">${labelText}</span>` : ''}
      </div>
      <div class="card-top-right">
        <button class="card-action-mini btn-archive" title="Archive note">🗄️</button>
        <button class="card-action-mini btn-delete" title="Delete note">✕</button>
      </div>
    </div>
    <div class="card-note-title">${escapeHtml(note.title)}</div>
    <div class="card-note-body">${formattedContent}</div>
    ${note.hasImage ? `<div class="card-image-indicator"><span>🖼</span><span>Image</span></div>` : ''}
  `;

  // Click card to open in editor
  card.addEventListener('click', (e) => {
    if (e.target.closest('.card-action-mini')) return;
    openEditor(note.id);
  });

  // Archive
  card.querySelector('.btn-archive').addEventListener('click', (e) => {
    e.stopPropagation();
    archiveNote(note.id);
  });

  // Delete
  card.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteNote(note.id);
  });

  // Interactive Checklist clicks
  card.querySelectorAll('.card-checklist-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const lineIndex = parseInt(item.getAttribute('data-line'), 10);
      toggleChecklistLine(note.id, lineIndex);
    });
  });

  return card;
}

function createNoteListRowElement(note) {
  const row = document.createElement('div');
  row.className = `note-list-row card-${note.color}`;

  const labelText = settings.labels[note.color] || '';
  const timeText = formatRelativeTime(note.updated_at);
  const firstLine = (note.content.split('\n')[0] || '').replace(/^[#-]\s*/, '');
  const isMono = settings.font === 'font-mono' || note.font === 'font-mono';
  const snippetHtml = isMono ? highlightCodeSyntax(firstLine) : escapeHtml(firstLine);

  row.innerHTML = `
    <div class="list-row-left">
      <span class="list-book-icon">📖</span>
      <span class="list-title">${escapeHtml(note.title)}</span>
      ${labelText ? `<span class="list-tag-pill">${labelText}</span>` : ''}
      <span class="list-snippet">${snippetHtml}</span>
    </div>
    <div class="list-row-right">${timeText}</div>
  `;

  row.addEventListener('click', () => openEditor(note.id));
  return row;
}

function renderArchivedNotes() {
  dom.archivedNotesContainer.innerHTML = '';
  const archived = notes.filter(n => n.archived);

  if (archived.length === 0) {
    dom.archivedEmptyState.classList.remove('hidden');
    return;
  }

  dom.archivedEmptyState.classList.add('hidden');

  archived.forEach(note => {
    const card = document.createElement('article');
    card.className = `note-card-item card-${note.color}`;
    card.innerHTML = `
      <div class="card-top-bar">
        <span class="card-timestamp">${formatRelativeTime(note.updated_at)}</span>
        <div class="card-top-right">
          <button class="card-action-mini btn-restore" title="Restore to active">↺ Restore</button>
          <button class="card-action-mini btn-delete-permanent" title="Delete permanently">🗑️</button>
        </div>
      </div>
      <div class="card-note-title">${escapeHtml(note.title)}</div>
      <div class="card-note-body">${escapeHtml(note.content.slice(0, 100))}...</div>
    `;

    card.querySelector('.btn-restore').addEventListener('click', () => restoreNote(note.id));
    card.querySelector('.btn-delete-permanent').addEventListener('click', () => deleteNotePermanent(note.id));

    dom.archivedNotesContainer.appendChild(card);
  });
}

// --------------------------------------------------------------------------
// NOTE EDITOR FLYOUT (Frame 4 & 29)
// --------------------------------------------------------------------------
function openEditor(noteId) {
  activeNoteId = noteId;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  dom.editorTitleInput.value = note.title;
  dom.editorContentInput.value = note.content;
  dom.editorSaveStatus.textContent = 'Saved · now';

  // Apply card color
  setEditorCardColor(note.color);

  // Apply active font onto editor card
  if (dom.editorCard) {
    dom.editorCard.className = dom.editorCard.className.replace(/font-[a-z-]+/g, '').trim();
    dom.editorCard.classList.add(settings.font || 'font-mono');
  }

  // Restore custom position or dimensions if set for this note
  if (note.customPosition && note.customPosition.x !== undefined) {
    dom.editorCard.classList.add('is-custom-positioned');
    dom.editorCard.style.left = `${note.customPosition.x}px`;
    dom.editorCard.style.top = `${note.customPosition.y}px`;
    dom.editorCard.style.right = 'auto';
    dom.editorCard.style.bottom = 'auto';
    if (note.customPosition.w) dom.editorCard.style.width = `${note.customPosition.w}px`;
    if (note.customPosition.h) dom.editorCard.style.height = `${note.customPosition.h}px`;
  } else {
    dom.editorCard.classList.remove('is-custom-positioned');
    dom.editorCard.style.left = '';
    dom.editorCard.style.top = '';
    dom.editorCard.style.right = '';
    dom.editorCard.style.bottom = '';
    dom.editorCard.style.width = '';
    dom.editorCard.style.height = '';
  }

  // Restore compact state
  if (note.compact) {
    dom.editorCard.classList.add('compact-mode');
    if (dom.editorCompactBtn) {
      dom.editorCompactBtn.textContent = '⤢';
      dom.editorCompactBtn.title = 'Expand to Full Size';
    }
  } else {
    dom.editorCard.classList.remove('compact-mode');
    if (dom.editorCompactBtn) {
      dom.editorCompactBtn.textContent = '↕';
      dom.editorCompactBtn.title = 'Reduce to Compact Note';
    }
  }

  // Pin state
  dom.editorPinBtn.style.opacity = note.pinned ? '1' : '0.5';

  dom.editorBackdrop.classList.remove('hidden');
  updateEditorSyntaxHighlight();
  renderDockTabs();
}

function updateEditorSyntaxHighlight() {
  if (!dom.editorHighlightBackdrop || !dom.editorContentInput) return;
  const text = dom.editorContentInput.value;
  const displayText = text.endsWith('\n') ? text + ' ' : text;
  dom.editorHighlightBackdrop.innerHTML = highlightCodeSyntax(displayText);
}

function closeEditor() {
  dom.editorBackdrop.classList.add('hidden');
  activeNoteId = null;
  renderDockTabs();
}

function setupEditorDragAndResize() {
  const card = dom.editorCard;
  const header = card ? card.querySelector('.editor-header') : null;
  const resizeHandle = dom.editorResizeHandle;
  const compactBtn = dom.editorCompactBtn;

  if (!card || !header) return;

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let cardInitialLeft = 0;
  let cardInitialTop = 0;

  // 1. FREE DRAGGING / MOVING
  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;

    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const rect = card.getBoundingClientRect();
    cardInitialLeft = rect.left;
    cardInitialTop = rect.top;

    card.classList.add('is-custom-positioned');
    card.style.left = `${cardInitialLeft}px`;
    card.style.top = `${cardInitialTop}px`;
    card.style.right = 'auto';
    card.style.bottom = 'auto';

    header.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev) => {
      if (!isDragging) return;
      const deltaX = ev.clientX - dragStartX;
      const deltaY = ev.clientY - dragStartY;

      const cardWidth = card.offsetWidth;
      const cardHeight = card.offsetHeight;

      let newLeft = cardInitialLeft + deltaX;
      let newTop = cardInitialTop + deltaY;

      // Keep completely within viewport
      newLeft = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - cardHeight - 10, newTop));

      card.style.left = `${newLeft}px`;
      card.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      // Save custom position for current note
      if (activeNoteId) {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
          const rect = card.getBoundingClientRect();
          note.customPosition = {
            ...(note.customPosition || {}),
            x: Math.round(rect.left),
            y: Math.round(rect.top)
          };
          persistState();
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  // Double click header resets to default dock position
  header.addEventListener('dblclick', (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    resetEditorCardPosition();
  });

  // 2. CORNER RESIZE (REDUCE / EXPAND WIDTH & HEIGHT)
  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = card.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = rect.width;
      const startHeight = rect.height;

      // Ensure explicit left & top are set
      card.classList.add('is-custom-positioned');
      card.style.left = `${rect.left}px`;
      card.style.top = `${rect.top}px`;
      card.style.right = 'auto';
      card.style.bottom = 'auto';

      document.body.style.cursor = 'nwse-resize';
      document.body.style.userSelect = 'none';

      const onResizeMove = (ev) => {
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        const maxWidth = window.innerWidth - rect.left - 15;
        const maxHeight = window.innerHeight - rect.top - 15;

        const newWidth = Math.max(250, Math.min(maxWidth, startWidth + deltaX));
        const newHeight = Math.max(180, Math.min(maxHeight, startHeight + deltaY));

        card.style.width = `${newWidth}px`;
        card.style.height = `${newHeight}px`;
      };

      const onResizeUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onResizeMove);
        window.removeEventListener('mouseup', onResizeUp);

        if (activeNoteId) {
          const note = notes.find(n => n.id === activeNoteId);
          if (note) {
            const curRect = card.getBoundingClientRect();
            note.customPosition = {
              ...(note.customPosition || {}),
              x: Math.round(curRect.left),
              y: Math.round(curRect.top),
              w: Math.round(curRect.width),
              h: Math.round(curRect.height)
            };
            persistState();
          }
        }
      };

      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', onResizeUp);
    });
  }

  // 3. COMPACT TOGGLE (REDUCE SIZE)
  if (compactBtn) {
    compactBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      card.classList.toggle('compact-mode');
      const isCompact = card.classList.contains('compact-mode');
      compactBtn.title = isCompact ? 'Expand to Full Size' : 'Reduce to Compact Note';
      compactBtn.textContent = isCompact ? '⤢' : '↕';

      if (activeNoteId) {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
          note.compact = isCompact;
          persistState();
        }
      }
    });
  }
}

function resetEditorCardPosition() {
  const card = dom.editorCard;
  if (!card) return;
  card.classList.remove('is-custom-positioned');
  card.classList.remove('compact-mode');
  card.style.left = '';
  card.style.top = '';
  card.style.right = '';
  card.style.bottom = '';
  card.style.width = '';
  card.style.height = '';
  if (dom.editorCompactBtn) {
    dom.editorCompactBtn.textContent = '↕';
    dom.editorCompactBtn.title = 'Reduce / Expand note size';
  }
  if (activeNoteId) {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      delete note.customPosition;
      delete note.compact;
      persistState();
    }
  }
}

function setNoteColor(color) {
  if (!activeNoteId) return;
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;

  note.color = color;
  setEditorCardColor(color);
  persistState();
  renderAllViews();
}

function setEditorCardColor(color) {
  dom.editorCard.className = dom.editorCard.className.replace(/card-[a-z]+/g, '').trim();
  dom.editorCard.classList.add(`card-${color}`);

  dom.swatches.forEach(swatch => {
    if (swatch.getAttribute('data-color') === color) {
      swatch.classList.add('active');
    } else {
      swatch.classList.remove('active');
    }
  });
}

function triggerAutoSave() {
  if (!activeNoteId) return;
  dom.editorSaveStatus.textContent = 'Saving...';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      note.title = dom.editorTitleInput.value.trim() || 'Untitled';
      note.content = dom.editorContentInput.value;
      note.updated_at = new Date().toISOString();
      persistState();
      dom.editorSaveStatus.textContent = 'Saved · now';
      renderAllViews();
    }
  }, 250);
}

function createNewNote() {
  const newNote = {
    id: `note-${Date.now()}`,
    title: 'New Stash',
    color: 'yellow',
    pinned: true,
    content: `- [ ] First task`,
    updated_at: new Date().toISOString(),
    archived: false
  };
  notes.unshift(newNote);
  persistState();
  renderAllViews();
  openEditor(newNote.id);
}

function archiveNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (note) {
    note.archived = true;
    persistState();
    renderAllViews();
  }
}

function restoreNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (note) {
    note.archived = false;
    persistState();
    renderAllViews();
  }
}

function deleteNote(noteId) {
  notes = notes.filter(n => n.id !== noteId);
  persistState();
  renderAllViews();
}

function deleteNotePermanent(noteId) {
  deleteNote(noteId);
}

function toggleChecklistLine(noteId, lineIndex) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const lines = note.content.split('\n');
  if (lines[lineIndex] !== undefined) {
    if (lines[lineIndex].includes('- [ ]')) {
      lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]');
    } else if (lines[lineIndex].includes('- [x]')) {
      lines[lineIndex] = lines[lineIndex].replace('- [x]', '- [ ]');
    }
    note.content = lines.join('\n');
    note.updated_at = new Date().toISOString();
    persistState();
    renderNotesGridAndList();
    if (activeNoteId === noteId) {
      dom.editorContentInput.value = note.content;
    }
  }
}

// --------------------------------------------------------------------------
// POMODORO & STOPWATCH (Frame 11 & 14)
// --------------------------------------------------------------------------
function setPomoMode(mode) {
  pomoMode = mode;
  if (mode === 'timer') {
    dom.pomoModeTimerBtn.classList.add('active');
    dom.pomoModeStopwatchBtn.classList.remove('active');
    dom.pomoTimerContainer.classList.remove('hidden');
    dom.pomoStopwatchContainer.classList.add('hidden');
  } else {
    dom.pomoModeStopwatchBtn.classList.add('active');
    dom.pomoModeTimerBtn.classList.remove('active');
    dom.pomoStopwatchContainer.classList.remove('hidden');
    dom.pomoTimerContainer.classList.add('hidden');
  }
}

function togglePomoPlay() {
  if (pomoIsRunning) {
    clearInterval(pomoTimerInterval);
    pomoIsRunning = false;
    dom.pomoPlayIcon.classList.remove('hidden');
    dom.pomoPauseIcon.classList.add('hidden');
  } else {
    pomoIsRunning = true;
    dom.pomoPlayIcon.classList.add('hidden');
    dom.pomoPauseIcon.classList.remove('hidden');

    pomoTimerInterval = setInterval(() => {
      if (pomoSecondsLeft > 0) {
        pomoSecondsLeft--;
        updatePomoClockDisplay();
      } else {
        clearInterval(pomoTimerInterval);
        pomoIsRunning = false;
        dom.pomoPlayIcon.classList.remove('hidden');
        dom.pomoPauseIcon.classList.add('hidden');
        alert('Pomodoro focus session completed! Take a break.');
      }
    }, 1000);
  }
}

function updatePomoClockDisplay() {
  const m = Math.floor(pomoSecondsLeft / 60);
  const s = pomoSecondsLeft % 60;
  dom.pomoMainClock.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toggleStopwatch() {
  if (stopwatchIsRunning) {
    clearInterval(stopwatchInterval);
    stopwatchIsRunning = false;
    dom.stopwatchPlayIcon.classList.remove('hidden');
    dom.stopwatchPauseIcon.classList.add('hidden');
    dom.stopwatchStatusText.textContent = 'PAUSED';
  } else {
    stopwatchIsRunning = true;
    dom.stopwatchPlayIcon.classList.add('hidden');
    dom.stopwatchPauseIcon.classList.remove('hidden');
    dom.stopwatchStatusText.textContent = 'COUNTING UP';

    const startTime = Date.now() - stopwatchMs;
    stopwatchInterval = setInterval(() => {
      stopwatchMs = Date.now() - startTime;
      updateStopwatchDisplay();
    }, 40);
  }
}

function resetStopwatch() {
  clearInterval(stopwatchInterval);
  stopwatchIsRunning = false;
  stopwatchMs = 0;
  dom.stopwatchPlayIcon.classList.remove('hidden');
  dom.stopwatchPauseIcon.classList.add('hidden');
  dom.stopwatchStatusText.textContent = 'TAP START TO COUNT UP';
  updateStopwatchDisplay();
}

function updateStopwatchDisplay() {
  const totalSeconds = Math.floor(stopwatchMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const ms = Math.floor((stopwatchMs % 1000) / 10);
  dom.stopwatchClock.innerHTML = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}<span class="ms-digits">.${String(ms).padStart(2, '0')}</span>`;
}

// --------------------------------------------------------------------------
// UTILITIES
// --------------------------------------------------------------------------
function formatRelativeTime(isoString) {
  if (!isoString) return 'Just now';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function parseMarkdownChecklists(content, isMono = false) {
  if (!content) return '';
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    if (line.trim().startsWith('- [ ]')) {
      const text = line.replace('- [ ]', '').trim();
      const innerHtml = isMono ? highlightCodeSyntax(text) : escapeHtml(text);
      return `<div class="card-checklist-item" data-line="${idx}"><span class="checkbox-box"></span><span>${innerHtml}</span></div>`;
    }
    if (line.trim().startsWith('- [x]')) {
      const text = line.replace('- [x]', '').trim();
      const innerHtml = isMono ? highlightCodeSyntax(text) : escapeHtml(text);
      return `<div class="card-checklist-item checked" data-line="${idx}"><span class="checkbox-box"></span><span>${innerHtml}</span></div>`;
    }
    // Highlight syntax if monospace font is active or line has code/YAML patterns
    if (isMono || /^(name:|on:|push:|tags:|permissions:|jobs:|release:|strategy:|fail-fast:|const|let|var|function|fn|pub|struct|import|\/\/|#)/.test(line.trim())) {
      return `<div class="code-line">${highlightCodeSyntax(line)}</div>`;
    }
    return `<div>${escapeHtml(line)}</div>`;
  }).join('');
}

function highlightCodeSyntax(rawText) {
  if (!rawText) return '';

  const tokenRegex = /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b[a-zA-Z0-9_-]+:(?=\s|$))|(\b(?:const|let|var|function|return|if|else|for|while|import|export|from|async|await|fn|pub|struct|impl|match|enum|type|interface|class|def|self|this|new|try|catch|throw|finally|switch|case|break|continue|default|mut|use|crate|mod|where|select|in|of|as)\b)|(\b(?:true|false|null|undefined|None|Some|Ok|Err|nil)\b)|(\[ \]|\[x\])|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())/g;

  let result = '';
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(rawText)) !== null) {
    result += escapeHtml(rawText.slice(lastIndex, match.index));

    const [fullMatch, comment, string, prop, keyword, bool, check, number, fn] = match;

    if (comment) {
      result += `<span class="syn-comment">${escapeHtml(comment)}</span>`;
    } else if (string) {
      result += `<span class="syn-str">${escapeHtml(string)}</span>`;
    } else if (prop) {
      result += `<span class="syn-prop">${escapeHtml(prop)}</span>`;
    } else if (keyword) {
      result += `<span class="syn-keyword">${escapeHtml(keyword)}</span>`;
    } else if (bool) {
      result += `<span class="syn-bool">${escapeHtml(bool)}</span>`;
    } else if (check) {
      result += `<span class="syn-check">${escapeHtml(check)}</span>`;
    } else if (number) {
      result += `<span class="syn-num">${escapeHtml(number)}</span>`;
    } else if (fn) {
      result += `<span class="syn-fn">${escapeHtml(fn)}</span>`;
    }

    lastIndex = tokenRegex.lastIndex;
  }

  result += escapeHtml(rawText.slice(lastIndex));
  return result;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fallbackInvoke(cmd, args) {
  console.log(`[Stashy Local Fallback] Invoking: ${cmd}`, args);
  return Promise.resolve(null);
}
