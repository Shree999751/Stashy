import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Initialize Lenis smooth momentum scrolling
const lenis = new Lenis({
  autoRaf: true,
});
if (typeof window !== 'undefined') {
  window.lenis = lenis;
}

// ==========================================================================
// STASHY CONTROLLER
// Pixel-accurate implementation of Stashy desktop application
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
  yellow: 'Ideas',
  red: 'Work',
  purple: 'College',
  blue: 'Notes',
  green: 'Personal',
  dark: 'CLI'
};

const BINDER_TABS_CONFIG = [
  {
    color: 'yellow',
    binderId: 'ideas',
    defaultLabel: 'Ideas',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 2v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/><path d="M12 6a5 5 0 0 0-3.5 8.5c.7.7 1.5 1.5 1.5 2.5h4c0-1 .8-1.8 1.5-2.5A5 5 0 0 0 12 6z"/></svg>`
  },
  {
    color: 'red',
    binderId: 'work',
    defaultLabel: 'Work',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`
  },
  {
    color: 'purple',
    binderId: 'college',
    defaultLabel: 'College',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
  },
  {
    color: 'blue',
    binderId: 'notes',
    defaultLabel: 'Notes',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
  },
  {
    color: 'green',
    binderId: 'personal',
    defaultLabel: 'Personal',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`
  },
  {
    color: 'dark',
    binderId: 'cli',
    defaultLabel: 'CLI',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`
  }
];

const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'Voice Stash & Mic AI',
    color: 'yellow',
    pinned: false,
    content: `- [x] Brainstorm edge-docked sound trigger\n- [ ] Whisper model on-device integration\n- [ ] Quick thought transcription prototype`,
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-2',
    title: 'Cold Storage Refinement',
    color: 'yellow',
    pinned: false,
    content: `Local disk serialization using Rust serde_json.\nInstant cold-boot restore in under 20ms.`,
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-3',
    title: 'SIH Problem Analysis',
    color: 'red',
    pinned: false,
    content: `- [x] SIH problem analysis\n- [ ] Architecture review with team\n- [ ] Research BIS standards\n- [ ] Prepare presentation`,
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-4',
    title: 'Release & CI Pipeline',
    color: 'red',
    pinned: false,
    content: `name: Release\non:\n  push:\n    tags:\n      - "v*"\n  permissions: write\n\njobs:\n  release:\n    strategy:\n      fail-fast: false`,
    updated_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-5',
    title: 'CS402 Operating Systems',
    color: 'purple',
    pinned: true,
    content: `Virtual memory paging algorithms:\n1. FIFO\n2. LRU (Least Recently Used)\n3. Clock page replacement`,
    updated_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-6',
    title: 'Algorithm Complexity Sheet',
    color: 'purple',
    pinned: false,
    content: `| Algorithm | Time (Avg) | Space |\n| :--- | :---: | :---: |\n| QuickSort | O(n log n) | O(log n) |\n| MergeSort | O(n log n) | O(n) |\n| HeapSort | O(n log n) | O(1) |\n`,
    updated_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-7',
    title: 'Meeting Takeaways',
    color: 'blue',
    pinned: false,
    content: `Discussed roadmap milestones and quarterly deliverables.\nNext sync on Friday 10:00 AM.\n\n- [ ] Update team backlog\n- [x] Send meeting minutes`,
    updated_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-8',
    title: 'Terminal Dotfiles & Aliases',
    color: 'blue',
    pinned: false,
    content: `\`\`\`bash\n# Stashy development aliases\nalias stash='tauri dev'\nalias stash-build='npm run build'\n\`\`\``,
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-9',
    title: 'Habit Tracker & Gym Routine',
    color: 'green',
    pinned: true,
    content: `- [x] Morning run 5km\n- [x] Push workout\n- [ ] 3 Litres water intake\n- [ ] Read 20 pages`,
    updated_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    archived: false
  },
  {
    id: 'note-10',
    title: 'Book Recommendations',
    color: 'green',
    pinned: false,
    content: `1. *Designing Data-Intensive Applications*\n2. *Atomic Habits*\n3. *The Pragmatic Programmer*`,
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
  font: 'font-sans',
  layout: 'grid',
  activeView: 'all-notes',
  plan: 'free',
  licenseKey: ''
};

let activeNoteId = null;
let activeBinder = 'yellow';
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
  updatePlanUI();
  renderAllViews();
  // Ensure board and all notes are closed by default on startup
  if (dom.boardWindow) dom.boardWindow.classList.add('hidden');
  closeEditor();
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
      const validFonts = ['font-sans', 'font-geist', 'font-figtree', 'font-mono', 'font-modern', 'font-handwritten', 'font-serif', 'font-playful'];
      if (!validFonts.includes(settings.font)) {
        settings.font = 'font-sans';
      }
      // Migrate older default labels if present
      const oldDefaults = ['In Progress', 'Almost There', 'You can do it.', 'Next Steps', 'FAAAAAAH'];
      const currentVals = Object.values(settings.labels || {});
      const hasOldDefaults = oldDefaults.some(v => currentVals.includes(v));
      if (hasOldDefaults) {
        settings.labels = { ...DEFAULT_LABELS };
      } else {
        settings.labels = { ...DEFAULT_LABELS, ...(settings.labels || {}) };
      }
    } else {
      settings.labels = { ...DEFAULT_LABELS };
    }
  } catch (e) {
    settings.labels = { ...DEFAULT_LABELS };
  }

  // Enforce clean CLI label for dark tab across state and localStorage
  if (!settings.labels) settings.labels = { ...DEFAULT_LABELS };
  if (!settings.labels.dark || settings.labels.dark.toLowerCase().includes('terminal') || settings.labels.dark.includes('/') || settings.labels.dark.length > 5) {
    settings.labels.dark = 'CLI';
    if (!settings.plan) settings.plan = (settings.licenseKey && settings.licenseKey.trim()) ? 'pro' : 'free';
    persistState();
  }

  // Purge any stale customPosition from unpinned notes so default position and size are pristine
  if (Array.isArray(notes)) {
    let touched = false;
    notes.forEach(n => {
      if (!n.pinned && n.customPosition) {
        delete n.customPosition;
        touched = true;
      }
      if (n.content) {
        const cleaned = cleanCorruptedFormatting(n.content);
        if (cleaned !== n.content) {
          n.content = cleaned;
          touched = true;
        }
      }
    });
    if (touched) persistState();
  }
  sanitizeAllNotes();
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
    sidebarAddNoteBtn: document.getElementById('sidebarAddNoteBtn'),
    sidebarSettingsBtn: document.getElementById('sidebarSettingsBtn'),
    sidebarBindersList: document.getElementById('sidebarBindersList'),
    navItems: document.querySelectorAll('.nav-item'),

    // Counts
    countAllNotes: document.getElementById('countAllNotes'),
    countChecklists: document.getElementById('countChecklists'),
    countPinned: document.getElementById('countPinned'),
    countArchived: document.getElementById('countArchived'),
    countTrash: document.getElementById('countTrash'),

    // Views
    viewPanels: document.querySelectorAll('.view-panel'),
    notesGrid: document.getElementById('notesGrid'),
    notesList: document.getElementById('notesList'),
    archivedNotesContainer: document.getElementById('archivedNotesContainer'),
    archivedEmptyState: document.getElementById('archivedEmptyState'),
    trashNotesContainer: document.getElementById('trashNotesContainer'),
    trashEmptyState: document.getElementById('trashEmptyState'),
    emptyTrashBtn: document.getElementById('emptyTrashBtn'),

    // Settings Screen Subnav & Subpanels
    settingsTabBtns: document.querySelectorAll('.settings-tab-btn'),
    settingsSubpanels: document.querySelectorAll('.settings-subpanel'),

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
    editorNoteNav: document.getElementById('editorNoteNav'),
    editorPrevNoteBtn: document.getElementById('editorPrevNoteBtn'),
    editorNextNoteBtn: document.getElementById('editorNextNoteBtn'),
    editorNoteIndex: document.getElementById('editorNoteIndex'),
    editorContentInput: document.getElementById('editorContentInput'),
    editorHighlightBackdrop: document.getElementById('editorHighlightBackdrop'),
    editorSaveStatus: document.getElementById('editorSaveStatus'),
    editorHeaderCloseBtn: document.getElementById('editorHeaderCloseBtn'),
    editorDeleteBtn: document.getElementById('editorDeleteBtn'),
    editorCloseBtn: document.getElementById('editorCloseBtn'),
    editorCompactBtn: document.getElementById('editorCompactBtn'),
    editorCopyBtn: document.getElementById('editorCopyBtn'),
    editorResizeHandle: document.getElementById('editorResizeHandle'),
    editorChecklistBtn: document.getElementById('editorChecklistBtn'),
    editorKebabMenuBtn: document.getElementById('editorKebabMenuBtn'),
    editorFormattingBar: document.getElementById('editorFormattingBar'),
    editorHiddenFileInput: document.getElementById('editorHiddenFileInput'),
    editorHiddenImageInput: document.getElementById('editorHiddenImageInput'),
    swatches: document.querySelectorAll('.swatch-circle'),

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
    fontChoiceCards: document.querySelectorAll('.font-choice-card'),

    // Upgrade Plan & Modal Elements
    sidebarUpgradeBtn: document.getElementById('sidebarUpgradeBtn'),
    upgradeModalBackdrop: document.getElementById('upgradeModalBackdrop'),
    upgradeModalCloseBtn: document.getElementById('upgradeModalCloseBtn'),
    modalStarterBtn: document.getElementById('modalStarterBtn'),
    modalUpgradeToProBtn: document.getElementById('modalUpgradeToProBtn'),
    modalUpgradeTeamBtn: document.getElementById('modalUpgradeTeamBtn'),
    modalToggleLicenseBtn: document.getElementById('modalToggleLicenseBtn'),
    modalLicenseInputRow: document.getElementById('modalLicenseInputRow'),
    modalLicenseKeyInput: document.getElementById('modalLicenseKeyInput'),
    modalActivateKeyBtn: document.getElementById('modalActivateKeyBtn'),
    modalLicenseMessage: document.getElementById('modalLicenseMessage'),
    modalStarterCurrentBadge: document.getElementById('modalStarterCurrentBadge'),
    modalProCurrentBadge: document.getElementById('modalProCurrentBadge'),

    // Settings Upgrade & License Subpanel Elements
    settingsPlanPill: document.getElementById('settingsPlanPill'),
    settingsStarterBtn: document.getElementById('settingsStarterBtn'),
    settingsUpgradeToProBtn: document.getElementById('settingsUpgradeToProBtn'),
    settingsUpgradeTeamBtn: document.getElementById('settingsUpgradeTeamBtn'),
    settingsStarterCurrentBadge: document.getElementById('settingsStarterCurrentBadge'),
    settingsProCurrentBadge: document.getElementById('settingsProCurrentBadge'),
    activateLicenseBtn: document.getElementById('activateLicenseBtn'),
    licenseKeyInput: document.getElementById('licenseKeyInput'),
    licenseStatusText: document.getElementById('licenseStatusText')
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
    createNewNote(activeBinder);
  });

  // Sidebar Add Note Button
  // Sidebar Upgrade Plan Card
  if (dom.sidebarUpgradeBtn) {
    dom.sidebarUpgradeBtn.addEventListener('click', openUpgradeModal);
    dom.sidebarUpgradeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openUpgradeModal();
      }
    });
  }

  // Modal actions
  if (dom.upgradeModalCloseBtn) {
    dom.upgradeModalCloseBtn.addEventListener('click', closeUpgradeModal);
  }
  if (dom.upgradeModalBackdrop) {
    dom.upgradeModalBackdrop.addEventListener('click', (e) => {
      if (e.target === dom.upgradeModalBackdrop) closeUpgradeModal();
    });
  }
  if (dom.modalUpgradeToProBtn) {
    dom.modalUpgradeToProBtn.addEventListener('click', () => upgradeToPro('modal'));
  }
  if (dom.settingsUpgradeToProBtn) {
    dom.settingsUpgradeToProBtn.addEventListener('click', () => upgradeToPro('settings'));
  }
  if (dom.modalUpgradeTeamBtn) {
    dom.modalUpgradeTeamBtn.addEventListener('click', () => {
      showToast('Contacting team sales: sales@stashy.app');
    });
  }
  if (dom.settingsUpgradeTeamBtn) {
    dom.settingsUpgradeTeamBtn.addEventListener('click', () => {
      showToast('Contacting team sales: sales@stashy.app');
    });
  }
  if (dom.modalToggleLicenseBtn && dom.modalLicenseInputRow) {
    dom.modalToggleLicenseBtn.addEventListener('click', () => {
      dom.modalLicenseInputRow.classList.toggle('hidden');
      if (!dom.modalLicenseInputRow.classList.contains('hidden') && dom.modalLicenseKeyInput) {
        dom.modalLicenseKeyInput.focus();
      }
    });
  }
  if (dom.modalActivateKeyBtn && dom.modalLicenseKeyInput) {
    dom.modalActivateKeyBtn.addEventListener('click', () => {
      activateLicense(dom.modalLicenseKeyInput.value, 'modal');
    });
    dom.modalLicenseKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') activateLicense(dom.modalLicenseKeyInput.value, 'modal');
    });
  }
  if (dom.activateLicenseBtn && dom.licenseKeyInput) {
    dom.activateLicenseBtn.addEventListener('click', () => {
      activateLicense(dom.licenseKeyInput.value, 'license');
    });
    dom.licenseKeyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') activateLicense(dom.licenseKeyInput.value, 'license');
    });
  }

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
  if (dom.crumbHomeLink) {
    dom.crumbHomeLink.addEventListener('click', () => switchView('all-notes'));
  }

  // Settings Screen Subnav Tabs
  if (dom.settingsTabBtns) {
    dom.settingsTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchSettingsTab(tab);
      });
    });
  }

  // Empty Trash Action
  if (dom.emptyTrashBtn) {
    dom.emptyTrashBtn.addEventListener('click', () => {
      emptyTrash();
    });
  }

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
      renderDockTabs();
      renderNotesGridAndList();
    });
  });

  // Dock Tabs Scroll Down / Cycle Button
  if (dom.dockScrollDownBtn && dom.dockTabsStack) {
    dom.dockScrollDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const atBottom = dom.dockTabsStack.scrollTop + dom.dockTabsStack.clientHeight >= dom.dockTabsStack.scrollHeight - 10;
      if (atBottom) {
        dom.dockTabsStack.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        dom.dockTabsStack.scrollBy({ top: 120, behavior: 'smooth' });
      }
    });

    dom.dockTabsStack.addEventListener('scroll', updateSpineScrollIndicator);
    window.addEventListener('resize', updateSpineScrollIndicator);
  }

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

  // Note Flyout Checklist Option beside Color
  if (dom.editorChecklistBtn) {
    dom.editorChecklistBtn.addEventListener('click', toggleOrInsertChecklist);
  }

  // Note Header Stepper (< 1 / 5 >) Navigation
  if (dom.editorPrevNoteBtn) {
    dom.editorPrevNoteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      navigateBinderNote(-1);
    });
  }
  if (dom.editorNextNoteBtn) {
    dom.editorNextNoteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      navigateBinderNote(1);
    });
  }
  if (dom.editorNoteIndex) {
    dom.editorNoteIndex.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateBinderNote(1);
    });
  }

  // Dismiss / close note when clicking on the empty screen (outside note card and dock rail)
  document.addEventListener('pointerdown', (e) => {
    // If editor is not open, do nothing
    if (!dom.editorBackdrop || dom.editorBackdrop.classList.contains('hidden')) return;

    // If click is inside the editor card itself, do not close
    if (e.target.closest('#editorCard') || e.target.closest('.editor-card')) {
      return;
    }

    // If click is inside the edge dock (tabs, + button, dock menu), let dock handle it
    if (e.target.closest('#edgeDock') || e.target.closest('.edge-dock')) {
      return;
    }

    // If click is inside any modal dialog or board window, do not close
    if (e.target.closest('.modal') || e.target.closest('.dialog-overlay') || e.target.closest('.view-panel') || e.target.closest('.board-window')) {
      return;
    }

    // Click is on the empty screen / desktop canvas -> Close the note!
    closeEditor();
  });

  // Note Header Close (✕) & Footer Close
  if (dom.editorHeaderCloseBtn) {
    dom.editorHeaderCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditor();
    });
  }
  if (dom.editorCloseBtn) {
    dom.editorCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeEditor();
    });
  }

  // Note Pin Toggle
  if (dom.editorPinBtn) {
    dom.editorPinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!activeNoteId) return;
      const note = notes.find(n => n.id === activeNoteId);
      if (note) {
        note.pinned = !note.pinned;
        dom.editorPinBtn.style.opacity = note.pinned ? '1' : '0.5';
        persistState();
        renderNotesGridAndList();
        renderDockTabs();
      }
    });
  }

  // Note Delete Action
  if (dom.editorDeleteBtn) {
    dom.editorDeleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeNoteId) {
        deleteNote(activeNoteId);
        closeEditor();
      }
    });
  }

  // Formatting Bar & Popover Actions
  if (dom.editorFormattingBar) {
    dom.editorFormattingBar.addEventListener('mousedown', (e) => {
      // Prevent clicking buttons from unfocusing editorContentInput and losing selection!
      e.preventDefault();
    });
    dom.editorFormattingBar.addEventListener('click', handlePopoverActionClick);
  }
  if (dom.editorKebabMenuBtn) {
    dom.editorKebabMenuBtn.addEventListener('click', toggleInsertPopover);
  }
  if (dom.editorHiddenImageInput) {
    dom.editorHiddenImageInput.addEventListener('change', handleImageUpload);
  }
  if (dom.editorHiddenFileInput) {
    dom.editorHiddenFileInput.addEventListener('change', handleFileUpload);
  }

  // Note Flyout Inputs Auto-save & Syntax Highlighting
  dom.editorTitleInput.addEventListener('input', triggerAutoSave);
  dom.editorContentInput.addEventListener('input', () => {
    updateEditorChecklistState();
    triggerAutoSave();
    clearTimeout(historySaveTimer);
    historySaveTimer = setTimeout(() => {
      pushNoteHistory(dom.editorContentInput.innerHTML, 0);
    }, 300);
  });
  dom.editorContentInput.addEventListener('keydown', handleEditorKeydown);
  dom.editorContentInput.addEventListener('keyup', updateEditorToolbarState);
  dom.editorContentInput.addEventListener('mouseup', updateEditorToolbarState);
  document.addEventListener('selectionchange', () => {
    if (dom.editorFlyout && !dom.editorFlyout.classList.contains('hidden')) {
      updateEditorToolbarState();
    }
  });
  dom.editorContentInput.addEventListener('click', (e) => {
    const box = e.target.closest('.checkbox-box');
    if (box) {
      const taskLine = box.closest('.editor-task-line');
      if (taskLine) {
        e.preventDefault();
        e.stopPropagation();
        const isChecked = taskLine.classList.contains('checked') || taskLine.getAttribute('data-checked') === 'true';
        if (isChecked) {
          taskLine.classList.remove('checked');
          taskLine.setAttribute('data-checked', 'false');
        } else {
          taskLine.classList.add('checked');
          taskLine.setAttribute('data-checked', 'true');
        }
        triggerAutoSave();
        pushNoteHistory(dom.editorContentInput.innerHTML, 0);
      }
    }
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

  // Escape key closes modal or editor
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dom.upgradeModalBackdrop && !dom.upgradeModalBackdrop.classList.contains('hidden')) {
        closeUpgradeModal();
        return;
      }
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dom.editorBackdrop.classList.contains('hidden')) {
      closeEditor();
    } else if (!dom.editorBackdrop.classList.contains('hidden')) {
      if ((e.altKey && e.key === 'ArrowLeft') || (e.ctrlKey && e.key === '[')) {
        e.preventDefault();
        navigateBinderNote(-1);
      } else if ((e.altKey && e.key === 'ArrowRight') || (e.ctrlKey && e.key === ']')) {
        e.preventDefault();
        navigateBinderNote(1);
      }
    }
  });

  // Dynamic moving & resizing of note card
  setupEditorDragAndResize();
}

// --------------------------------------------------------------------------
// VIEW NAVIGATION
// --------------------------------------------------------------------------
function switchSettingsTab(tabName) {
  if (dom.settingsTabBtns) {
    dom.settingsTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
  }
  const subpanelMap = {
    'dock': 'settingsTabDock',
    'font': 'settingsTabFont',
    'labels': 'settingsTabLabels',
    'sync': 'settingsTabSync',
    'upgrade': 'settingsTabUpgrade',
    'license': 'settingsTabLicense',
    'contact': 'settingsTabContact'
  };
  const targetId = subpanelMap[tabName] || 'settingsTabDock';
  if (dom.settingsSubpanels) {
    dom.settingsSubpanels.forEach(panel => {
      if (panel.id === targetId) {
        panel.classList.remove('hidden');
        panel.classList.add('active');
      } else {
        panel.classList.add('hidden');
        panel.classList.remove('active');
      }
    });
  }
}

// --------------------------------------------------------------------------
// UPGRADE & PLANS LOGIC
// --------------------------------------------------------------------------
function openUpgradeModal() {
  if (dom.upgradeModalBackdrop) {
    dom.upgradeModalBackdrop.classList.remove('hidden');
    updatePlanUI();
  }
}

function closeUpgradeModal() {
  if (dom.upgradeModalBackdrop) {
    dom.upgradeModalBackdrop.classList.add('hidden');
    if (dom.modalLicenseMessage) {
      dom.modalLicenseMessage.classList.add('hidden');
      dom.modalLicenseMessage.textContent = '';
    }
  }
}

function upgradeToPro(source = 'modal') {
  settings.plan = 'pro';
  if (!settings.licenseKey) {
    settings.licenseKey = 'STASHY-PRO-LIFETIME-UNLOCKED';
  }
  persistState();
  updatePlanUI();
  showToast('🎉 Upgraded to Stashy Pro! Lifetime features unlocked.');

  if (dom.modalLicenseMessage) {
    dom.modalLicenseMessage.className = 'modal-license-msg success';
    dom.modalLicenseMessage.textContent = '🎉 Congratulations! Stashy Pro Lifetime is active.';
    dom.modalLicenseMessage.classList.remove('hidden');
  }

  if (source === 'modal') {
    setTimeout(() => {
      closeUpgradeModal();
    }, 1200);
  }
}

function activateLicense(key, source = 'license') {
  const cleanKey = (key || '').trim();
  const feedbackEl = source === 'modal' ? dom.modalLicenseMessage : null;

  if (!cleanKey) {
    if (feedbackEl) {
      feedbackEl.className = 'modal-license-msg error';
      feedbackEl.textContent = 'Please enter a valid license key.';
      feedbackEl.classList.remove('hidden');
    }
    showToast('Please enter a valid license key.', 'error');
    return;
  }

  settings.plan = 'pro';
  settings.licenseKey = cleanKey;
  persistState();
  updatePlanUI();

  if (feedbackEl) {
    feedbackEl.className = 'modal-license-msg success';
    feedbackEl.textContent = '✨ License activated! Welcome to Stashy Pro.';
    feedbackEl.classList.remove('hidden');
  }

  showToast('✨ License key activated! Pro unlocked.');

  if (source === 'modal') {
    setTimeout(() => {
      closeUpgradeModal();
    }, 1400);
  }
}

function updatePlanUI() {
  const isPro = settings.plan === 'pro';

  // 1. Sidebar Upgrade Option Card
  if (dom.sidebarUpgradeBtn) {
    const titleEl = dom.sidebarUpgradeBtn.querySelector('.upgrade-text-title');
    const descEl = dom.sidebarUpgradeBtn.querySelector('.upgrade-text-desc');
    if (isPro) {
      dom.sidebarUpgradeBtn.classList.add('is-pro-active');
      dom.sidebarUpgradeBtn.title = 'Stashy Pro Active — Manage Plan';
      if (titleEl) titleEl.textContent = 'Stashy Pro';
      if (descEl) descEl.textContent = 'Lifetime Active';
    } else {
      dom.sidebarUpgradeBtn.classList.remove('is-pro-active');
      dom.sidebarUpgradeBtn.title = 'Upgrade your plan';
      if (titleEl) titleEl.textContent = 'Upgrade';
      if (descEl) descEl.textContent = 'your plan';
    }
  }

  // 2. Modal Plan Card Badges & Buttons
  if (dom.modalStarterCurrentBadge) {
    dom.modalStarterCurrentBadge.style.display = isPro ? 'none' : 'inline-block';
  }
  if (dom.modalProCurrentBadge) {
    dom.modalProCurrentBadge.classList.toggle('hidden', !isPro);
  }
  if (dom.modalUpgradeToProBtn) {
    if (isPro) {
      dom.modalUpgradeToProBtn.innerHTML = '<span>Active (Lifetime)</span>';
      dom.modalUpgradeToProBtn.disabled = true;
      dom.modalUpgradeToProBtn.classList.add('btn-plan-current');
      dom.modalUpgradeToProBtn.classList.remove('btn-plan-pro');
    } else {
      dom.modalUpgradeToProBtn.innerHTML = '<span>Upgrade to Pro</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
      dom.modalUpgradeToProBtn.disabled = false;
      dom.modalUpgradeToProBtn.classList.remove('btn-plan-current');
      dom.modalUpgradeToProBtn.classList.add('btn-plan-pro');
    }
  }

  // 3. Settings In-Page Upgrade Subpanel
  if (dom.settingsPlanPill) {
    dom.settingsPlanPill.textContent = isPro ? 'PRO ACTIVATED' : 'FREE STARTER';
    dom.settingsPlanPill.style.background = isPro ? '#065F46' : '#2563EB';
    dom.settingsPlanPill.style.color = '#FFFFFF';
  }
  if (dom.settingsStarterCurrentBadge) {
    dom.settingsStarterCurrentBadge.style.display = isPro ? 'none' : 'inline-block';
  }
  if (dom.settingsProCurrentBadge) {
    dom.settingsProCurrentBadge.classList.toggle('hidden', !isPro);
  }
  if (dom.settingsUpgradeToProBtn) {
    if (isPro) {
      dom.settingsUpgradeToProBtn.innerHTML = '<span>Active (Lifetime)</span>';
      dom.settingsUpgradeToProBtn.disabled = true;
      dom.settingsUpgradeToProBtn.classList.add('btn-plan-current');
      dom.settingsUpgradeToProBtn.classList.remove('btn-plan-pro');
    } else {
      dom.settingsUpgradeToProBtn.innerHTML = '<span>Upgrade to Pro</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
      dom.settingsUpgradeToProBtn.disabled = false;
      dom.settingsUpgradeToProBtn.classList.remove('btn-plan-current');
      dom.settingsUpgradeToProBtn.classList.add('btn-plan-pro');
    }
  }

  // 4. Settings License Subpanel
  if (dom.licenseStatusText) {
    dom.licenseStatusText.textContent = isPro ? 'PRO ACTIVATED' : 'FREE STARTER';
    if (dom.licenseStatusText.parentElement) {
      dom.licenseStatusText.parentElement.style.background = isPro ? '#ecfdf5' : '#f1f5f9';
      dom.licenseStatusText.parentElement.style.color = isPro ? '#059669' : '#64748b';
    }
  }
  if (dom.licenseKeyInput) {
    dom.licenseKeyInput.value = settings.licenseKey || (isPro ? 'STASHY-PRO-LIFETIME-UNLOCKED' : '');
  }
}

function showToast(message, type = 'success') {
  let toast = document.getElementById('stashyToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'stashyToast';
    toast.className = 'stashy-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('active');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('active');
  }, 2600);
}

function switchView(viewName, subtab = null) {
  settings.activeView = viewName;
  if (dom.navItems) {
    dom.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // De-activate sidebar binder items if not viewing a binder
  const sidebarBinderBtns = document.querySelectorAll('.sidebar-binder-item');
  sidebarBinderBtns.forEach(btn => {
    btn.classList.toggle('active', viewName === 'binder-' + btn.getAttribute('data-color'));
  });

  if (dom.viewPanels) {
    dom.viewPanels.forEach(panel => panel.classList.remove('active'));
  }

  const viewMap = {
    'all-notes': 'viewAllNotes',
    'checklists': 'viewAllNotes',
    'pinned': 'viewAllNotes',
    'archived': 'viewArchived',
    'trash': 'viewTrash',
    'settings': 'viewSettings',
    // Backward compatibility mappings
    'dock-position': 'viewSettings',
    'upgrade': 'viewSettings',
    'license': 'viewSettings',
    'sync': 'viewSettings',
    'set-labels': 'viewSettings',
    'font': 'viewSettings',
    'contact': 'viewSettings'
  };

  const titles = {
    'all-notes': 'All notes',
    'checklists': 'Checklists',
    'pinned': 'Pinned notes',
    'archived': 'Archived',
    'trash': 'Trash',
    'settings': 'Settings',
    'dock-position': 'Dock position',
    'upgrade': 'Plans & Upgrades',
    'license': 'License',
    'sync': 'Sync',
    'set-labels': 'Set labels',
    'font': 'Font',
    'contact': 'Contact'
  };

  const targetPanelId = viewMap[viewName] || 'viewAllNotes';
  const targetPanel = document.getElementById(targetPanelId);
  if (targetPanel) targetPanel.classList.add('active');

  if (dom.crumbCurrentView) {
    dom.crumbCurrentView.textContent = titles[viewName] || 'All notes';
  }

  // Handle settings subpanel switching
  if (targetPanelId === 'viewSettings') {
    const tabMap = {
      'settings': subtab || 'dock',
      'dock-position': 'dock',
      'upgrade': 'upgrade',
      'license': 'license',
      'sync': 'sync',
      'set-labels': 'labels',
      'font': 'font',
      'contact': 'contact'
    };
    switchSettingsTab(tabMap[viewName] || 'dock');
  }

  if (viewName === 'checklists') {
    currentFilter = 'checklist';
    if (dom.filterMenu) {
      dom.filterMenu.querySelectorAll('.dropdown-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === 'checklist');
      });
    }
    renderNotesGridAndList();
  } else if (viewName === 'pinned') {
    currentFilter = 'pinned';
    if (dom.filterMenu) {
      dom.filterMenu.querySelectorAll('.dropdown-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === 'pinned');
      });
    }
    renderNotesGridAndList();
  } else if (viewName === 'all-notes') {
    currentFilter = 'all';
    if (dom.filterMenu) {
      dom.filterMenu.querySelectorAll('.dropdown-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === 'all');
      });
    }
    renderNotesGridAndList();
  }

  if (viewName === 'archived') {
    renderArchivedNotes();
  }

  if (viewName === 'trash') {
    renderTrashNotes();
  }

  if (dom.monitorCards) {
    dom.monitorCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-pos') === settings.dock_position);
    });
  }

  updateSidebarCounts();
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
  if (!pos) pos = 'right-top';
  settings.dock_position = pos;
  document.body.className = document.body.className.replace(/\bdock-edge-[a-z-]+\b/g, '').trim();
  document.body.classList.add(`dock-edge-${pos}`);

  if (dom.monitorCards) {
    dom.monitorCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-pos') === pos);
    });
  }

  persistState();
  updateSpineScrollIndicator();
}

function applyFont(font) {
  if (!font) font = 'font-sans';
  settings.font = font;
  document.body.className = document.body.className.replace(/\bfont-[a-z-]+\b/g, '').trim();
  document.body.classList.add(font);
  if (dom.editorCard) {
    dom.editorCard.className = dom.editorCard.className.replace(/\bfont-[a-z-]+\b/g, '').trim();
    dom.editorCard.classList.add(font);
  }
  if (dom.fontChoiceCards) {
    dom.fontChoiceCards.forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-font') === font);
    });
  }
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
  renderSidebarBinders();
}

// --------------------------------------------------------------------------
// RENDERING
// --------------------------------------------------------------------------
function renderAllViews() {
  renderDockTabs();
  renderNotesGridAndList();
  renderArchivedNotes();
  renderTrashNotes();
  renderSidebarBinders();
  updateSidebarCounts();
}

function renderSidebarBinders() {
  if (!dom.sidebarBindersList) return;
  dom.sidebarBindersList.innerHTML = '';

  const binderKeys = ['yellow', 'red', 'purple', 'blue', 'green', 'dark'];
  const activeNotes = notes.filter(n => !n.archived && !n.inTrash);

  binderKeys.forEach(color => {
    const label = settings.labels[color] || color.toUpperCase();
    const count = activeNotes.filter(n => n.color === color).length;

    const btn = document.createElement('button');
    btn.className = `sidebar-binder-item ${currentFilter === color ? 'active' : ''}`;
    btn.setAttribute('data-color', color);
    btn.innerHTML = `
      <span class="binder-color-dot" style="background-color: ${BINDER_ACCENTS[color] || '#cbd5e1'};"></span>
      <span class="binder-name" style="flex: 1; text-align: left;">${escapeHtml(label)}</span>
      <span class="nav-count">${count}</span>
    `;

    btn.addEventListener('click', () => {
      selectBinder(color);
    });

    dom.sidebarBindersList.appendChild(btn);
  });
}

function updateSidebarCounts() {
  const activeNotes = notes.filter(n => !n.archived && !n.inTrash);
  const checklistCount = activeNotes.filter(n => n.content && (n.content.includes('- [ ]') || n.content.includes('- [x]'))).length;
  const pinnedCount = activeNotes.filter(n => !!n.pinned).length;
  const archivedCount = notes.filter(n => n.archived && !n.inTrash).length;
  const trashCount = notes.filter(n => !!n.inTrash).length;

  if (dom.countAllNotes) dom.countAllNotes.textContent = activeNotes.length;
  if (dom.countChecklists) dom.countChecklists.textContent = checklistCount;
  if (dom.countPinned) dom.countPinned.textContent = pinnedCount;
  if (dom.countArchived) dom.countArchived.textContent = archivedCount;
  if (dom.countTrash) dom.countTrash.textContent = trashCount;
}

const BINDER_ACCENTS = {
  yellow: '#facc15',
  red: '#f87171',
  purple: '#c084fc',
  blue: '#38bdf8',
  green: '#4ade80',
  dark: '#18181b'
};

function triggerNotesCrossFade() {
  const notesArea = document.querySelector('.board-main-area');
  if (notesArea) {
    notesArea.classList.remove('notes-crossfade');
    void notesArea.offsetWidth;
    notesArea.classList.add('notes-crossfade');
  }
}

function updateSpineScrollIndicator() {
  if (!dom.dockTabsStack || !dom.dockScrollDownBtn) return;
  const spinesContainer = dom.dockTabsStack.closest('.dock-spines-container');
  const hasOverflow = dom.dockTabsStack.scrollHeight > dom.dockTabsStack.clientHeight + 4;
  if (hasOverflow) {
    dom.dockScrollDownBtn.classList.remove('hidden');
    if (spinesContainer) spinesContainer.classList.add('has-scroll-overflow');
  } else {
    dom.dockScrollDownBtn.classList.add('hidden');
    if (spinesContainer) spinesContainer.classList.remove('has-scroll-overflow');
  }
}

function selectBinder(color) {
  activeBinder = color;
  currentFilter = color;

  const activeNotes = notes.filter(n => !n.archived && !n.inTrash);
  const matchingNotes = activeNotes.filter(n => n.color === color);
  const label = settings.labels[color] || color.toUpperCase();

  // 1. If board window exists, sync its view to this binder
  if (dom.boardWindow) {
    if (dom.viewPanels) {
      dom.viewPanels.forEach(panel => panel.classList.remove('active'));
    }
    const targetPanel = document.getElementById('viewAllNotes');
    if (targetPanel) targetPanel.classList.add('active');

    if (dom.navItems) {
      dom.navItems.forEach(item => item.classList.remove('active'));
    }

    document.querySelectorAll('.sidebar-binder-item').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-color') === color);
    });

    if (dom.crumbCurrentView) {
      dom.crumbCurrentView.textContent = label;
    }

    if (dom.filterMenu) {
      dom.filterMenu.querySelectorAll('.dropdown-item').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-filter') === color);
      });
    }

    triggerNotesCrossFade();
    renderNotesGridAndList();
  }

  // 2. Synchronize dock tabs
  renderDockTabs();

  // 3. Immediately switch the open note to this binder's note!
  if (matchingNotes.length > 0) {
    openEditor(matchingNotes[0].id);
  } else {
    createNewNote(color);
  }
}

function renderDockTabs() {
  if (!dom.dockTabsStack) return;
  dom.dockTabsStack.innerHTML = '';

  const activeNotes = notes.filter(n => !n.archived && !n.inTrash);

  // If currentFilter matches a binder color, sync activeBinder with it
  if (BINDER_ACCENTS[currentFilter]) {
    activeBinder = currentFilter;
  }

  // Set active binder accent on document root for notes area left edge tinting
  const activeAccent = BINDER_ACCENTS[activeBinder] || '#EF9F27';
  document.documentElement.style.setProperty('--active-binder-accent', activeAccent);

  BINDER_TABS_CONFIG.forEach(tabConfig => {
    const matchingNotes = activeNotes.filter(n => n.color === tabConfig.color);
    const count = matchingNotes.length;

    let labelText = settings.labels[tabConfig.color] || tabConfig.defaultLabel;
    if (tabConfig.color === 'dark') {
      labelText = 'CLI';
    }

    const isActive = activeBinder === tabConfig.color;

    const spineBtn = document.createElement('button');
    spineBtn.className = `color-spine dock-spine-${tabConfig.color} dock-spine-${tabConfig.binderId} ${isActive ? 'active' : ''}`;
    spineBtn.setAttribute('role', 'tab');
    spineBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    spineBtn.setAttribute('aria-label', `${labelText}, ${count} ${count === 1 ? 'note' : 'notes'}`);
    spineBtn.setAttribute('data-color', tabConfig.color);
    spineBtn.setAttribute('data-binder', tabConfig.binderId);
    spineBtn.setAttribute('tabindex', isActive ? '0' : '-1');
    spineBtn.title = `${labelText} (${count} ${count === 1 ? 'note' : 'notes'})`;

    spineBtn.innerHTML = `
      <div class="color-spine-content">
        <div class="spine-icon" aria-hidden="true">${tabConfig.iconSvg}</div>
        <span class="spine-name">${escapeHtml(labelText)}</span>
        <span class="spine-count ${count === 0 ? 'hidden' : ''}">${count}</span>
      </div>
    `;

    // 1. Single Click: Select binder, open latest note or cycle notes if already open
    spineBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      const isEditorOpen = dom.editorBackdrop && !dom.editorBackdrop.classList.contains('hidden');
      const currentNote = activeNoteId ? notes.find(n => n.id === activeNoteId) : null;
      const isSameBinder = isEditorOpen && currentNote && currentNote.color === tabConfig.color;

      // If note editor is currently open on this exact binder:
      if (isSameBinder) {
        // If binder has multiple notes, cycle to next note!
        if (matchingNotes.length > 1) {
          const currentIdx = matchingNotes.findIndex(n => n.id === activeNoteId);
          const nextIdx = (currentIdx + 1) % matchingNotes.length;
          openEditor(matchingNotes[nextIdx].id);
          return;
        } else {
          // If only 1 note, toggle closed
          closeEditor();
          return;
        }
      }

      // Switch to this binder and immediately open its note!
      selectBinder(tabConfig.color);
    });

    // 2. Double Click: Open latest note or create note
    spineBtn.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      if (matchingNotes.length > 0) {
        openEditor(matchingNotes[0].id);
      } else {
        createNewNote(tabConfig.color);
      }
    });

    // 3. Right Click: Quick note in this binder
    spineBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      createNewNote(tabConfig.color);
    });

    // 4. Keyboard Navigation (ArrowUp, ArrowDown, Home, End, Enter, Space)
    spineBtn.addEventListener('keydown', (e) => {
      const allSpines = Array.from(dom.dockTabsStack.querySelectorAll('.color-spine'));
      const currentIndex = allSpines.indexOf(spineBtn);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % allSpines.length;
        allSpines.forEach(s => s.setAttribute('tabindex', '-1'));
        allSpines[nextIndex].setAttribute('tabindex', '0');
        allSpines[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + allSpines.length) % allSpines.length;
        allSpines.forEach(s => s.setAttribute('tabindex', '-1'));
        allSpines[prevIndex].setAttribute('tabindex', '0');
        allSpines[prevIndex].focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        allSpines.forEach(s => s.setAttribute('tabindex', '-1'));
        allSpines[0]?.setAttribute('tabindex', '0');
        allSpines[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        allSpines.forEach(s => s.setAttribute('tabindex', '-1'));
        allSpines[allSpines.length - 1]?.setAttribute('tabindex', '0');
        allSpines[allSpines.length - 1]?.focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectBinder(tabConfig.color, matchingNotes);
      }
    });

    dom.dockTabsStack.appendChild(spineBtn);
  });

  updateSpineScrollIndicator();
}

function renderNotesGridAndList() {
  dom.notesGrid.innerHTML = '';
  dom.notesList.innerHTML = '';

  const activeNotes = notes.filter(n => !n.archived && !n.inTrash);

  // Apply filters & search
  const filtered = activeNotes.filter(n => {
    let matchFilter = true;
    if (currentFilter === 'all') {
      matchFilter = true;
    } else if (currentFilter === 'checklist') {
      matchFilter = !!(n.content && (n.content.includes('- [ ]') || n.content.includes('- [x]')));
    } else if (currentFilter === 'pinned') {
      matchFilter = !!n.pinned;
    } else {
      matchFilter = n.color === currentFilter;
    }
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
      <h3 class="card-note-title">${escapeHtml(note.title)}</h3>
      <div class="card-top-right">
        <button class="card-action-mini btn-archive" title="Archive note">🗄️</button>
        <button class="card-action-mini btn-delete" title="Move note to trash">✕</button>
      </div>
    </div>
    <div class="card-note-body">${formattedContent}</div>
    ${note.hasImage ? `<div class="card-image-indicator"><span>🖼</span><span>Image</span></div>` : ''}
    <div class="card-bottom-meta">
      <span class="card-meta-time">${timeText}</span>
      ${labelText ? `<span class="card-meta-dot">·</span><span class="card-meta-label">${escapeHtml(labelText)}</span>` : ''}
    </div>
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
  if (!dom.archivedNotesContainer) return;
  dom.archivedNotesContainer.innerHTML = '';
  const archived = notes.filter(n => n.archived && !n.inTrash);

  if (archived.length === 0) {
    if (dom.archivedEmptyState) dom.archivedEmptyState.classList.remove('hidden');
    return;
  }

  if (dom.archivedEmptyState) dom.archivedEmptyState.classList.add('hidden');

  archived.forEach(note => {
    const card = document.createElement('article');
    card.className = `note-card-item card-${note.color}`;
    const labelText = settings.labels[note.color] || '';
    card.innerHTML = `
      <div class="card-top-bar">
        <h3 class="card-note-title">${escapeHtml(note.title)}</h3>
        <div class="card-top-right">
          <button class="card-action-mini btn-restore" title="Restore to active">↺ Restore</button>
          <button class="card-action-mini btn-delete-permanent" title="Move to trash">🗑️</button>
        </div>
      </div>
      <div class="card-note-body">${escapeHtml(note.content.slice(0, 100))}...</div>
      <div class="card-bottom-meta">
        <span class="card-meta-time">${formatRelativeTime(note.updated_at)}</span>
        ${labelText ? `<span class="card-meta-dot">·</span><span class="card-meta-label">${escapeHtml(labelText)}</span>` : ''}
      </div>
    `;

    card.querySelector('.btn-restore').addEventListener('click', () => restoreNote(note.id));
    card.querySelector('.btn-delete-permanent').addEventListener('click', () => deleteNote(note.id));

    dom.archivedNotesContainer.appendChild(card);
  });
}

function renderTrashNotes() {
  if (!dom.trashNotesContainer) return;
  dom.trashNotesContainer.innerHTML = '';
  const trash = notes.filter(n => !!n.inTrash);

  if (trash.length === 0) {
    if (dom.trashEmptyState) dom.trashEmptyState.classList.remove('hidden');
    return;
  }

  if (dom.trashEmptyState) dom.trashEmptyState.classList.add('hidden');

  trash.forEach(note => {
    const card = document.createElement('article');
    card.className = `note-card-item card-${note.color}`;
    const labelText = settings.labels[note.color] || '';
    card.innerHTML = `
      <div class="card-top-bar">
        <h3 class="card-note-title">${escapeHtml(note.title)}</h3>
        <div class="card-top-right">
          <button class="card-action-mini btn-restore" title="Restore note to active">↺ Restore</button>
          <button class="card-action-mini btn-delete-permanent" title="Delete permanently">✕ Delete</button>
        </div>
      </div>
      <div class="card-note-body">${escapeHtml(note.content.slice(0, 100))}...</div>
      <div class="card-bottom-meta">
        <span class="card-meta-time">${formatRelativeTime(note.updated_at)}</span>
        ${labelText ? `<span class="card-meta-dot">·</span><span class="card-meta-label">${escapeHtml(labelText)}</span>` : ''}
      </div>
    `;

    card.querySelector('.btn-restore').addEventListener('click', () => restoreNoteFromTrash(note.id));
    card.querySelector('.btn-delete-permanent').addEventListener('click', () => deleteNotePermanent(note.id));

    dom.trashNotesContainer.appendChild(card);
  });
}

// --------------------------------------------------------------------------
// NOTE EDITOR FLYOUT (Frame 4 & 29)
// --------------------------------------------------------------------------
function openEditor(noteId) {
  activeNoteId = noteId;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  if (note.content) {
    const cleaned = cleanCorruptedFormatting(note.content);
    if (cleaned !== note.content) {
      note.content = cleaned;
      persistState();
    }
  }

  dom.editorTitleInput.value = note.title;
  dom.editorTitleInput.title = note.title;
  dom.editorContentInput.innerHTML = markdownToRichHtml(note.content);
  initNoteHistory(note.content);
  dom.editorSaveStatus.textContent = 'Saved · now';

  // Apply card color
  setEditorCardColor(note.color);

  // Apply active font onto editor card
  if (dom.editorCard) {
    dom.editorCard.className = dom.editorCard.className.replace(/font-[a-z-]+/g, '').trim();
    dom.editorCard.classList.add(settings.font || 'font-mono');
  }

  // Always keep activeBinder and dock in sync with the opened note's color
  activeBinder = note.color;

  // Restore custom position or dimensions only if note is pinned and has explicit coordinates
  if (note.pinned && note.customPosition && note.customPosition.x !== undefined) {
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
    dom.editorCard.style.right = '';
    dom.editorCard.style.bottom = '';
    dom.editorCard.style.width = '';
    dom.editorCard.style.height = '';

    // Synchronize active binder tab and align note next to it
    activeBinder = note.color;
    renderDockTabs();

    dom.editorCard.style.top = '';
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

  // Update binder note stepper (e.g. 1 / 5)
  if (dom.editorNoteNav && dom.editorNoteIndex) {
    const activeNotes = notes.filter(n => !n.archived && !n.inTrash && n.color === note.color);
    if (activeNotes.length > 1) {
      const idx = activeNotes.findIndex(n => n.id === note.id);
      dom.editorNoteIndex.textContent = `${idx + 1} / ${activeNotes.length}`;
      dom.editorNoteNav.classList.remove('hidden');
    } else {
      dom.editorNoteNav.classList.add('hidden');
    }
  }

  if (dom.editorFormattingBar) dom.editorFormattingBar.classList.remove('hidden');
  if (dom.editorKebabMenuBtn) dom.editorKebabMenuBtn.classList.add('active');
  dom.editorBackdrop.classList.remove('hidden');
  updateEditorChecklistState();
  updateEditorSyntaxHighlight();
  renderDockTabs();
}

function navigateBinderNote(dir) {
  if (!activeNoteId) return;
  const currentNote = notes.find(n => n.id === activeNoteId);
  if (!currentNote) return;

  // Persist current note contents before switching
  if (dom.editorTitleInput) currentNote.title = dom.editorTitleInput.value.trim() || 'Untitled';
  if (dom.editorContentInput) currentNote.content = dom.editorContentInput.innerHTML;
  currentNote.updated_at = new Date().toISOString();
  persistState();

  const activeNotes = notes.filter(n => !n.archived && !n.inTrash && n.color === currentNote.color);
  if (activeNotes.length <= 1) return;
  const currentIndex = activeNotes.findIndex(n => n.id === activeNoteId);
  const safeIdx = currentIndex >= 0 ? currentIndex : 0;
  const newIndex = (safeIdx + dir + activeNotes.length) % activeNotes.length;
  openEditor(activeNotes[newIndex].id);
}

function updateEditorSyntaxHighlight() {
  if (!dom.editorHighlightBackdrop || !dom.editorContentInput) return;
  const text = dom.editorContentInput.innerText || '';
  const displayText = text.endsWith('\n') ? text + ' ' : text;
  dom.editorHighlightBackdrop.innerHTML = highlightCodeSyntax(displayText);
}

function closeEditor() {
  if (!dom.editorBackdrop || dom.editorBackdrop.classList.contains('hidden')) return;

  // Immediately flush & save active note changes so nothing is lost
  if (activeNoteId) {
    clearTimeout(saveTimeout);
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      if (dom.editorTitleInput) note.title = dom.editorTitleInput.value.trim() || 'Untitled';
      if (dom.editorContentInput) note.content = dom.editorContentInput.innerHTML;
      note.updated_at = new Date().toISOString();
      persistState();
      renderAllViews();
    }
  }

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
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.editor-note-nav')) return;

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
          note.pinned = true;
          note.customPosition = {
            ...(note.customPosition || {}),
            x: Math.round(rect.left),
            y: Math.round(rect.top)
          };
          if (dom.editorPinBtn) dom.editorPinBtn.style.opacity = '1';
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
            note.pinned = true;
            note.customPosition = {
              ...(note.customPosition || {}),
              x: Math.round(curRect.left),
              y: Math.round(curRect.top),
              w: Math.round(curRect.width),
              h: Math.round(curRect.height)
            };
            if (dom.editorPinBtn) dom.editorPinBtn.style.opacity = '1';
            persistState();
          }
        }
      };

      window.addEventListener('mousemove', onResizeMove);
      window.addEventListener('mouseup', onResizeUp);
    });
  }

  // 3. COMPACT TOGGLE (REDUCE / EXPAND SIZE)
  if (compactBtn) {
    compactBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      card.style.height = ''; // Clear inline height so compact / full modes apply cleanly
      const isCompact = card.classList.toggle('compact-mode');
      compactBtn.title = isCompact ? 'Expand to Full Size' : 'Reduce to Compact Note';
      compactBtn.textContent = isCompact ? '⤢' : '↕';

      if (activeNoteId) {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
          note.compact = isCompact;
          if (note.customPosition) {
            delete note.customPosition.h;
          }
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
      note.content = dom.editorContentInput.innerHTML;
      note.updated_at = new Date().toISOString();
      persistState();
      dom.editorSaveStatus.textContent = 'Saved · now';
      renderAllViews();
    }
  }, 250);
}

function createNewNote(color = null) {
  const chosenColor = color || (currentFilter !== 'all' && currentFilter !== 'checklist' ? currentFilter : 'yellow');
  const catLabel = settings.labels[chosenColor] || 'Stash';
  const newNote = {
    id: `note-${Date.now()}`,
    title: `New ${catLabel}`,
    color: chosenColor,
    pinned: false,
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
    delete note.inTrash;
    persistState();
    renderAllViews();
  }
}

function restoreNoteFromTrash(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (note) {
    delete note.inTrash;
    note.archived = false;
    persistState();
    renderAllViews();
  }
}

function deleteNote(noteId) {
  const note = notes.find(n => n.id === noteId);
  if (note) {
    note.inTrash = true;
    note.archived = false;
    delete note.pinned;
    persistState();
    renderAllViews();
  }
}

function deleteNotePermanent(noteId) {
  notes = notes.filter(n => n.id !== noteId);
  persistState();
  renderAllViews();
}

function emptyTrash() {
  notes = notes.filter(n => !n.inTrash);
  persistState();
  renderAllViews();
}

function toggleChecklistLine(noteId, lineIndex) {
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  // If note.content is HTML with editor-task-line
  if (note.content.includes('editor-task-line')) {
    const temp = document.createElement('div');
    temp.innerHTML = note.content;
    const taskRows = temp.querySelectorAll('.editor-task-line');
    if (taskRows[lineIndex]) {
      const row = taskRows[lineIndex];
      const isChecked = row.classList.contains('checked') || row.getAttribute('data-checked') === 'true';
      if (isChecked) {
        row.classList.remove('checked');
        row.setAttribute('data-checked', 'false');
      } else {
        row.classList.add('checked');
        row.setAttribute('data-checked', 'true');
      }
      note.content = temp.innerHTML;
      note.updated_at = new Date().toISOString();
      persistState();
      renderNotesGridAndList();
      if (activeNoteId === noteId && dom.editorContentInput) {
        dom.editorContentInput.innerHTML = note.content;
      }
    }
    return;
  }

  // If note.content is markdown
  const lines = note.content.split('\n');
  let taskCounter = 0;
  for (let i = 0; i < lines.length; i++) {
    if (/^(?:-\s*)?\[[ xX]\]/.test(lines[i].trim())) {
      if (taskCounter === lineIndex) {
        if (lines[i].includes('- [ ]') || lines[i].includes('[ ]')) {
          lines[i] = lines[i].replace(/\[ \]/, '[x]');
        } else {
          lines[i] = lines[i].replace(/\[[xX]\]/, '[ ]');
        }
        break;
      }
      taskCounter++;
    }
  }
  note.content = lines.join('\n');
  note.updated_at = new Date().toISOString();
  persistState();
  renderNotesGridAndList();
  if (activeNoteId === noteId && dom.editorContentInput) {
    dom.editorContentInput.innerHTML = markdownToRichHtml(note.content);
  }
}

// --------------------------------------------------------------------------
// CHECKLIST CONTROLS & SMART EDITOR KEYBOARD SUPPORT
// --------------------------------------------------------------------------
function toggleOrInsertChecklist() {
  if (!activeNoteId) return;
  const el = dom.editorContentInput;
  if (!el) return;

  if (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT') {
    el.focus();
    const sel = window.getSelection();
    let taskLine = null;
    if (sel && sel.anchorNode) {
      taskLine = sel.anchorNode.nodeType === Node.ELEMENT_NODE
        ? sel.anchorNode.closest('.editor-task-line')
        : sel.anchorNode.parentElement?.closest('.editor-task-line');
    }

    if (taskLine) {
      const isChecked = taskLine.classList.contains('checked') || taskLine.getAttribute('data-checked') === 'true';
      if (isChecked) {
        taskLine.classList.remove('checked');
        taskLine.setAttribute('data-checked', 'false');
      } else {
        taskLine.classList.add('checked');
        taskLine.setAttribute('data-checked', 'true');
      }
    } else {
      const selectedText = sel ? sel.toString().trim() : '';
      const taskHtml = `<div class="editor-task-line" data-checked="false"><span class="checkbox-box" contenteditable="false"></span><span class="task-text">${selectedText ? escapeHtml(selectedText) : 'New task'}</span></div><div><br></div>`;
      document.execCommand('insertHTML', false, taskHtml);
    }
    triggerAutoSave();
    pushNoteHistory(el.innerHTML, 0);
    updateEditorChecklistState();
    return;
  }

  const textarea = el;
  const text = textarea.value || '';
  const selStart = textarea.selectionStart || 0;
  const selEnd = textarea.selectionEnd || 0;

  if (selStart !== selEnd) {
    // Multi-line range selection: toggle checkboxes with strike on selected lines
    const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
    let lineEnd = text.indexOf('\n', selEnd);
    if (lineEnd === -1) lineEnd = text.length;

    const before = text.substring(0, lineStart);
    const selectedBlock = text.substring(lineStart, lineEnd);
    const after = text.substring(lineEnd);

    const lines = selectedBlock.split('\n');
    const hasUnchecked = lines.some(l => /^\s*-\s*\[ \]\s*/.test(l));
    const allChecked = lines.every(l => !l.trim() || /^\s*-\s*\[[xX]\]\s*/.test(l));

    let newLines;
    if (hasUnchecked) {
      // Tick all unchecked items to checked (- [x]) -> Strike through tasks!
      newLines = lines.map(l => {
        if (/^\s*-\s*\[ \]\s*/.test(l)) {
          return l.replace(/^(\s*)-\s*\[ \]\s*/, '$1- [x] ');
        }
        return l;
      });
    } else if (allChecked) {
      // Toggle back to unchecked (- [ ]) -> Remove strike through!
      newLines = lines.map(l => l.replace(/^(\s*)-\s*\[[xX]\]\s*/, '$1- [ ] '));
    } else {
      // Add checkboxes to lines
      newLines = lines.map(l => {
        if (!l.trim()) return l;
        if (/^\s*-\s*\[[ xX]\]\s*/.test(l)) return l;
        const indentMatch = l.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        const content = l.slice(indent.length);
        return `${indent}- [x] ${content}`;
      });
    }

    const replacement = newLines.join('\n');
    textarea.value = before + replacement + after;
    textarea.selectionStart = lineStart;
    textarea.selectionEnd = lineStart + replacement.length;
  } else {
    // Single cursor: toggle checklist on current line
    const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
    let lineEnd = text.indexOf('\n', selStart);
    if (lineEnd === -1) lineEnd = text.length;

    const currentLine = text.substring(lineStart, lineEnd);
    const beforeLine = text.substring(0, lineStart);
    const afterLine = text.substring(lineEnd);

    let newLine = '';
    let newCursorPos = selStart;

    if (/^\s*-\s*\[ \]\s*/.test(currentLine)) {
      // Toggle unchecked to checked (- [x]) -> Strike through task!
      newLine = currentLine.replace(/^(\s*)-\s*\[ \]\s*/, '$1- [x] ');
      newCursorPos = selStart + (newLine.length - currentLine.length);
    } else if (/^\s*-\s*\[[xX]\]\s*/.test(currentLine)) {
      // Toggle checked (- [x]) back to unchecked (- [ ]) -> Remove strike through!
      newLine = currentLine.replace(/^(\s*)-\s*\[[xX]\]\s*/, '$1- [ ] ');
      newCursorPos = selStart + (newLine.length - currentLine.length);
    } else if (currentLine.trim() === '') {
      // Empty line -> create unchecked task
      newLine = '- [ ] ';
      newCursorPos = lineStart + newLine.length;
    } else {
      // Line with text -> turn into task and tick it!
      const indentMatch = currentLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const content = currentLine.slice(indent.length);
      newLine = `${indent}- [x] ${content}`;
      newCursorPos = selStart + 6;
    }

    textarea.value = beforeLine + newLine + afterLine;
    textarea.selectionStart = newCursorPos;
    textarea.selectionEnd = newCursorPos;
  }

  textarea.focus();
  pushNoteHistory(textarea.value, textarea.selectionStart);
  updateEditorChecklistState();
  updateEditorSyntaxHighlight();
  triggerAutoSave();
}

function handleEditorKeydown(e) {
  if (!dom.editorContentInput) return;

  // Ctrl+H shortcut for Heading
  if ((e.ctrlKey || e.metaKey) && (e.key === 'h' || e.key === 'H')) {
    e.preventDefault();
    toggleHeading();
    return;
  }

  // Smart heading Enter continuation: pressing Enter inside a heading creates a normal div line below
  if (e.key === 'Enter' && !e.shiftKey) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      let heading = range.commonAncestorContainer;
      while (heading && heading !== dom.editorContentInput) {
        if (heading.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/i.test(heading.tagName)) {
          break;
        }
        heading = heading.parentNode;
      }

      if (heading && heading !== dom.editorContentInput) {
        e.preventDefault();
        const nextDiv = document.createElement('div');
        nextDiv.innerHTML = '<br>';

        if (heading.nextSibling) {
          heading.parentNode.insertBefore(nextDiv, heading.nextSibling);
        } else {
          heading.parentNode.appendChild(nextDiv);
        }

        const newRange = document.createRange();
        newRange.setStart(nextDiv, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        triggerAutoSave();
        pushNoteHistory(dom.editorContentInput.innerHTML, 0);
        updateEditorToolbarState();
        return;
      }
    }
  }

  // Smart checklist Enter continuation
  if (e.key === 'Enter') {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const taskLine = range.startContainer.nodeType === Node.ELEMENT_NODE
      ? range.startContainer.closest('.editor-task-line')
      : range.startContainer.parentElement?.closest('.editor-task-line');

    if (taskLine) {
      e.preventDefault();
      const taskText = (taskLine.querySelector('.task-text')?.textContent || '').trim();
      if (!taskText) {
        // Empty task line: convert to normal div/paragraph (exit checklist mode)
        const emptyDiv = document.createElement('div');
        emptyDiv.innerHTML = '<br>';
        taskLine.parentNode.replaceChild(emptyDiv, taskLine);
        const newRange = document.createRange();
        newRange.setStart(emptyDiv, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else {
        // Insert a new unchecked task line below
        const newTask = document.createElement('div');
        newTask.className = 'editor-task-line';
        newTask.setAttribute('data-checked', 'false');
        newTask.innerHTML = '<span class="checkbox-box" contenteditable="false"></span><span class="task-text">&nbsp;</span>';

        if (taskLine.nextSibling) {
          taskLine.parentNode.insertBefore(newTask, taskLine.nextSibling);
        } else {
          taskLine.parentNode.appendChild(newTask);
        }

        const textSpan = newTask.querySelector('.task-text');
        const newRange = document.createRange();
        newRange.selectNodeContents(textSpan);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      triggerAutoSave();
    }
  }
}

function updateEditorChecklistState() {
  if (!dom.editorChecklistBtn || !dom.editorContentInput) return;
  const content = dom.editorContentInput.innerHTML || '';
  const hasChecklist = content.includes('editor-task-line') || content.includes('- [ ]') || content.includes('- [x]');
  dom.editorChecklistBtn.classList.toggle('active', hasChecklist);
  if (hasChecklist) {
    const total = (content.match(/- \[[ xX]\]/g) || []).length;
    const checked = (content.match(/- \[[xX]\]/g) || []).length;
    dom.editorChecklistBtn.title = `Checklist active: ${checked}/${total} tasks completed (Click to toggle/insert, Ctrl+Enter to toggle item)`;
  } else {
    dom.editorChecklistBtn.title = 'Add / Toggle Checklist (- [ ])';
  }
}

function toggleHeading() {
  const el = dom.editorContentInput;
  if (!el) return;
  el.focus();

  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) {
    const h2 = document.createElement('h2');
    h2.innerHTML = '<br>';
    el.appendChild(h2);
    const range = document.createRange();
    range.setStart(h2, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    triggerAutoSave();
    pushNoteHistory(el.innerHTML, 0);
    updateEditorToolbarState();
    return;
  }

  const range = sel.getRangeAt(0);

  // 1. Check if selection is currently inside an existing heading (H1 - H6)
  let headingNode = null;
  let curr = range.commonAncestorContainer;
  while (curr && curr !== el) {
    if (curr.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/i.test(curr.tagName)) {
      headingNode = curr;
      break;
    }
    curr = curr.parentNode;
  }

  if (headingNode) {
    // TOGGLE OFF: Convert heading to a normal div line
    const div = document.createElement('div');
    const content = headingNode.innerHTML.trim();
    div.innerHTML = (content && content !== '<br>') ? content : '<br>';
    headingNode.parentNode.replaceChild(div, headingNode);

    const newRange = document.createRange();
    newRange.selectNodeContents(div);
    newRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(newRange);
  } else {
    // 2. Check if inside a checklist line
    let taskLine = null;
    let currTask = range.commonAncestorContainer;
    while (currTask && currTask !== el) {
      if (currTask.nodeType === Node.ELEMENT_NODE && currTask.classList.contains('editor-task-line')) {
        taskLine = currTask;
        break;
      }
      currTask = currTask.parentNode;
    }

    if (taskLine) {
      const text = (taskLine.querySelector('.task-text')?.innerHTML || '').trim();
      const h2 = document.createElement('h2');
      h2.innerHTML = text || 'Heading';
      taskLine.parentNode.replaceChild(h2, taskLine);

      const newRange = document.createRange();
      newRange.selectNodeContents(h2);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      // 3. Find top-level block inside editorContentInput
      let block = range.commonAncestorContainer;
      while (block && block.parentNode !== el && block !== el) {
        block = block.parentNode;
      }

      if (block && block !== el) {
        const h2 = document.createElement('h2');
        if (block.nodeType === Node.ELEMENT_NODE) {
          const blockContent = block.innerHTML.trim();
          h2.innerHTML = (blockContent && blockContent !== '<br>') ? blockContent : '<br>';
          block.parentNode.replaceChild(h2, block);
        } else if (block.nodeType === Node.TEXT_NODE) {
          const textContent = block.textContent.trim();
          h2.innerHTML = textContent || '<br>';
          block.parentNode.replaceChild(h2, block);
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(h2);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
      } else {
        // 4. Fallback for empty editor or direct selection
        if (!el.textContent.trim()) {
          el.innerHTML = '<h2><br></h2>';
          const h2 = el.querySelector('h2');
          const newRange = document.createRange();
          newRange.setStart(h2, 0);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          document.execCommand('formatBlock', false, '<h2>');
        }
      }
    }
  }

  triggerAutoSave();
  pushNoteHistory(el.innerHTML, 0);
  updateEditorChecklistState();
  updateEditorToolbarState();
}

function updateEditorToolbarState() {
  if (!dom.editorFormattingBar || !dom.editorContentInput) return;

  const sel = window.getSelection();
  let inHeading = false;
  let inTask = false;

  if (sel && sel.rangeCount) {
    let node = sel.anchorNode;
    while (node && node !== dom.editorContentInput) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (/^H[1-6]$/i.test(node.tagName)) inHeading = true;
        if (node.classList.contains('editor-task-line')) inTask = true;
      }
      node = node.parentNode;
    }
  }

  const headingBtn = dom.editorFormattingBar.querySelector('[data-action="format-heading"]');
  if (headingBtn) headingBtn.classList.toggle('active', inHeading);

  const checklistBtn = dom.editorFormattingBar.querySelector('[data-action="format-checklist"]');
  if (checklistBtn) checklistBtn.classList.toggle('active', inTask);

  const boldBtn = dom.editorFormattingBar.querySelector('[data-action="format-bold"]');
  if (boldBtn) {
    try { boldBtn.classList.toggle('active', document.queryCommandState('bold')); } catch (_) {}
  }
  const italicBtn = dom.editorFormattingBar.querySelector('[data-action="format-italic"]');
  if (italicBtn) {
    try { italicBtn.classList.toggle('active', document.queryCommandState('italic')); } catch (_) {}
  }
  const underlineBtn = dom.editorFormattingBar.querySelector('[data-action="format-underline"]');
  if (underlineBtn) {
    try { underlineBtn.classList.toggle('active', document.queryCommandState('underline')); } catch (_) {}
  }
}

async function copyActiveNoteContent() {
  if (!activeNoteId) return;
  const note = notes.find(n => n.id === activeNoteId);
  const contentToCopy = dom.editorContentInput ? (dom.editorContentInput.innerText || dom.editorContentInput.textContent) : (note ? stripHtml(note.content) : '');

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(contentToCopy);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = contentToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    // Visual feedback
    if (dom.editorCopyBtn) {
      const originalHtml = dom.editorCopyBtn.innerHTML;
      dom.editorCopyBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      dom.editorCopyBtn.title = 'Copied to clipboard!';

      const prevSaveStatus = dom.editorSaveStatus ? dom.editorSaveStatus.textContent : '';
      if (dom.editorSaveStatus) {
        dom.editorSaveStatus.textContent = 'Copied!';
        dom.editorSaveStatus.style.background = '#dcfce7';
        dom.editorSaveStatus.style.color = '#15803d';
      }

      setTimeout(() => {
        if (dom.editorCopyBtn) {
          dom.editorCopyBtn.innerHTML = originalHtml;
          dom.editorCopyBtn.title = 'Copy note content';
        }
        if (dom.editorSaveStatus) {
          dom.editorSaveStatus.textContent = prevSaveStatus || 'Saved · now';
          dom.editorSaveStatus.style.background = '';
          dom.editorSaveStatus.style.color = '';
        }
      }, 1400);
    }
  } catch (err) {
    console.error('Failed to copy note:', err);
  }
}

// --------------------------------------------------------------------------
// FORMATTING & MEDIA TOOLBAR (2nd Image Feature & Kebab Menu)
// --------------------------------------------------------------------------
function toggleInsertPopover(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  const bar = dom.editorFormattingBar;
  if (!bar) return;
  const isHidden = bar.classList.contains('hidden');
  if (isHidden) {
    openInsertPopover();
  } else {
    closeInsertPopover();
  }
}


// --------------------------------------------------------------------------
// NOTE EDITOR UNDO / REDO ENGINE
// --------------------------------------------------------------------------
let noteHistory = [];
let historyIndex = -1;
let historySaveTimer = null;

function initNoteHistory(initialContent) {
  noteHistory = [{ content: initialContent || '', cursor: 0 }];
  historyIndex = 0;
}

function pushNoteHistory(content, cursor) {
  if (historyIndex >= 0 && noteHistory[historyIndex] && noteHistory[historyIndex].content === content) {
    return;
  }
  noteHistory = noteHistory.slice(0, historyIndex + 1);
  noteHistory.push({ content, cursor: cursor || 0 });
  if (noteHistory.length > 60) noteHistory.shift();
  historyIndex = noteHistory.length - 1;
}

function performUndo() {
  const el = dom.editorContentInput;
  if (!el) return;

  if (historyIndex > 0) {
    historyIndex--;
    const state = noteHistory[historyIndex];
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = state.content;
      el.selectionStart = el.selectionEnd = state.cursor || state.content.length;
    } else {
      el.innerHTML = state.content;
    }
    el.focus();
    updateEditorChecklistState();
    updateEditorSyntaxHighlight();
    triggerAutoSave();
  } else {
    document.execCommand('undo');
    updateEditorChecklistState();
    updateEditorSyntaxHighlight();
    triggerAutoSave();
  }
}

function performRedo() {
  const el = dom.editorContentInput;
  if (!el) return;

  if (historyIndex < noteHistory.length - 1) {
    historyIndex++;
    const state = noteHistory[historyIndex];
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      el.value = state.content;
      el.selectionStart = el.selectionEnd = state.cursor || state.content.length;
    } else {
      el.innerHTML = state.content;
    }
    el.focus();
    updateEditorChecklistState();
    updateEditorSyntaxHighlight();
    triggerAutoSave();
  } else {
    document.execCommand('redo');
    updateEditorChecklistState();
    updateEditorSyntaxHighlight();
    triggerAutoSave();
  }
}

function stripMarkdownSymbols(text) {
  if (!text) return '';
  return text
    .replace(/\*+/g, '')
    .replace(/<\/?u>/gi, '')
    .replace(/&lt;\/?u&gt;/gi, '')
    .replace(/<\/?(del|s|strong|em|b|i)>/gi, '')
    .replace(/&lt;\/?(del|s|strong|em|b|i)&gt;/gi, '')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/```[a-zA-Z0-9_-]*\r?\n?/g, '')
    .replace(/```/g, '')
    .replace(/`/g, '');
}

function cleanCorruptedFormatting(text) {
  if (!text) return text;
  let cleaned = text;
  // Completely strip asterisks, <u>, </u>, code fences, broken # from tasks
  cleaned = cleaned.replace(/\*+/g, '');
  cleaned = cleaned.replace(/<\/?u>/gi, '');
  cleaned = cleaned.replace(/&lt;\/?u&gt;/gi, '');
  cleaned = cleaned.replace(/<\/?(del|s|strong|em|b|i)>/gi, '');
  cleaned = cleaned.replace(/&lt;\/?(del|s|strong|em|b|i)&gt;/gi, '');
  cleaned = cleaned.replace(/^(\s*)#+\s*-\s*\[([ xX])\]/gm, '$1- [$2]');
  cleaned = cleaned.replace(/```[a-zA-Z0-9_-]*\r?\n?/g, '');
  cleaned = cleaned.replace(/```/g, '');
  cleaned = cleaned.replace(/`/g, '');
  return cleaned;
}

function sanitizeAllNotes() {
  if (!Array.isArray(notes)) return;
  let changed = false;
  notes.forEach(n => {
    if (n && n.content) {
      const original = n.content;
      n.content = cleanCorruptedFormatting(n.content);
      if (n.content !== original) changed = true;
    }
  });
  if (changed) persistState();
}

function markdownToRichHtml(text) {
  if (!text) return '';
  const cleaned = cleanCorruptedFormatting(text);

  // If already rich HTML with editor-task-line, headings, or divs
  if (cleaned.includes('editor-task-line') || /<(h[1-6]|div|p|ul|ol|table|blockquote)[\s>]/i.test(cleaned)) {
    return cleaned;
  }

  const lines = cleaned.split('\n');
  let taskIdx = 0;
  const htmlLines = lines.map(line => {
    const trimmed = line.trim();

    // 1. Checked checklist: - [x] or - [X] or [x] or [X]
    const checkedMatch = trimmed.match(/^(?:-\s*)?\[[xX]\]\s*(.*)$/);
    if (checkedMatch) {
      const taskText = formatInlineMarkdown(checkedMatch[1]);
      return `<div class="editor-task-line checked" data-checked="true" data-line="${taskIdx++}"><span class="checkbox-box" contenteditable="false"></span><span class="task-text">${taskText || '&nbsp;'}</span></div>`;
    }

    // 2. Unchecked checklist: - [ ] or [ ]
    const uncheckedMatch = trimmed.match(/^(?:-\s*)?\[ \]\s*(.*)$/);
    if (uncheckedMatch) {
      const taskText = formatInlineMarkdown(uncheckedMatch[1]);
      return `<div class="editor-task-line" data-checked="false" data-line="${taskIdx++}"><span class="checkbox-box" contenteditable="false"></span><span class="task-text">${taskText || '&nbsp;'}</span></div>`;
    }

    // 3. Headings: #, ##, ### (render as H2/H3 without showing the # symbols)
    const h1Match = trimmed.match(/^#\s+(.*)$/);
    if (h1Match) return `<h2>${formatInlineMarkdown(h1Match[1])}</h2>`;
    const h2Match = trimmed.match(/^##\s+(.*)$/);
    if (h2Match) return `<h3>${formatInlineMarkdown(h2Match[1])}</h3>`;
    const h3Match = trimmed.match(/^###\s+(.*)$/);
    if (h3Match) return `<h4>${formatInlineMarkdown(h3Match[1])}</h4>`;

    // 4. Bullet list: - item or * item
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) return `<li>${formatInlineMarkdown(bulletMatch[1])}</li>`;

    // 5. Empty line
    if (!trimmed) return `<div><br></div>`;

    // 6. Regular line
    return `<div>${formatInlineMarkdown(line)}</div>`;
  });

  return htmlLines.join('');
}


function openInsertPopover() {
  if (dom.editorFormattingBar) dom.editorFormattingBar.classList.remove('hidden');
  if (dom.editorKebabMenuBtn) dom.editorKebabMenuBtn.classList.add('active');
}

function closeInsertPopover() {
  if (dom.editorFormattingBar) dom.editorFormattingBar.classList.add('hidden');
  if (dom.editorKebabMenuBtn) dom.editorKebabMenuBtn.classList.remove('active');
}

function applyWrapFormatting(prefix, suffix, defaultText = 'text') {
  const textarea = dom.editorContentInput;
  if (!textarea) return;

  let text = textarea.value;
  let start = textarea.selectionStart;
  let end = textarea.selectionEnd;

  // If no selection, expand to word under cursor
  if (start === end) {
    let wStart = start;
    let wEnd = end;
    while (wStart > 0 && !/\s/.test(text[wStart - 1])) wStart--;
    while (wEnd < text.length && !/\s/.test(text[wEnd])) wEnd++;
    if (wStart !== wEnd) {
      start = wStart;
      end = wEnd;
    }
  }

  const selected = text.substring(start, end);

  // 1. Check if selection is ALREADY wrapped: e.g. **word** or <u>word</u>
  if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
    // UNWRAP (TOGGLE OFF)
    const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
    const cleaned = prefix === '**' ? unwrapped.replace(/^\*+|\*+$/g, '') : unwrapped;
    textarea.value = text.substring(0, start) + cleaned + text.substring(end);
    textarea.selectionStart = start;
    textarea.selectionEnd = start + cleaned.length;
    textarea.focus();
    pushNoteHistory(textarea.value, textarea.selectionStart);
    updateEditorChecklistState();
    updateEditorSyntaxHighlight();
    triggerAutoSave();
    return;
  }

  // 2. Check if text directly surrounding selection is already prefix and suffix
  const hasPrefixBefore = start >= prefix.length && text.substring(start - prefix.length, start) === prefix;
  const hasSuffixAfter = end + suffix.length <= text.length && text.substring(end, end + suffix.length) === suffix;

  if (hasPrefixBefore && hasSuffixAfter) {
    // UNWRAP (TOGGLE OFF)
    const before = text.substring(0, start - prefix.length);
    const after = text.substring(end + suffix.length);
    textarea.value = before + selected + after;
    textarea.selectionStart = start - prefix.length;
    textarea.selectionEnd = textarea.selectionStart + selected.length;
    textarea.focus();
    pushNoteHistory(textarea.value, textarea.selectionStart);
    updateEditorChecklistState();
    updateEditorSyntaxHighlight();
    triggerAutoSave();
    return;
  }

  // 3. Otherwise wrap cleanly
  const toWrap = selected || defaultText;
  const cleanToWrap = prefix === '**' ? toWrap.replace(/\*{2,}/g, '') : toWrap;
  const replacement = prefix + cleanToWrap + suffix;

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.selectionStart = start + prefix.length;
  textarea.selectionEnd = start + prefix.length + cleanToWrap.length;
  textarea.focus();
  pushNoteHistory(textarea.value, textarea.selectionStart);
  updateEditorChecklistState();
  updateEditorSyntaxHighlight();
  triggerAutoSave();
}

function applyLinePrefix(type) {
  const textarea = dom.editorContentInput;
  if (!textarea) return;
  const text = textarea.value;
  const selStart = textarea.selectionStart;
  const selEnd = textarea.selectionEnd;

  const lineStart = text.lastIndexOf('\n', selStart - 1) + 1;
  let lineEnd = text.indexOf('\n', selEnd);
  if (lineEnd === -1) lineEnd = text.length;

  const before = text.substring(0, lineStart);
  const block = text.substring(lineStart, lineEnd);
  const after = text.substring(lineEnd);

  const lines = block.split('\n');
  let newLines;

  if (type === 'bullet') {
    newLines = lines.map(line => {
      if (/^\s*-\s+/.test(line)) return line.replace(/^(\s*)-\s+/, '$1');
      return `- ${line}`;
    });
  } else if (type === 'number') {
    newLines = lines.map((line, idx) => {
      if (/^\s*\d+\.\s+/.test(line)) return line.replace(/^(\s*)\d+\.\s+/, '$1');
      return `${idx + 1}. ${line}`;
    });
  } else if (type === 'heading') {
    newLines = lines.map(line => {
      // If line is a checklist, don't prepend # to break the checkbox!
      const checkMatch = line.match(/^(\s*-\s*\[[ xX]\]\s*)(.*)$/);
      if (checkMatch) {
        const prefix = checkMatch[1];
        const content = checkMatch[2];
        if (content.startsWith('**') && content.endsWith('**')) {
          return `${prefix}${content.slice(2, -2)}`;
        } else {
          return `${prefix}**${content}**`;
        }
      }
      if (/^###\s+/.test(line)) return line.replace(/^###\s+/, '');
      if (/^##\s+/.test(line)) return line.replace(/^##\s+/, '### ');
      if (/^#\s+/.test(line)) return line.replace(/^#\s+/, '## ');
      return `# ${line}`;
    });
  }

  const replacement = newLines.join('\n');
  textarea.value = before + replacement + after;
  textarea.selectionStart = lineStart;
  textarea.selectionEnd = lineStart + replacement.length;
  textarea.focus();
  pushNoteHistory(textarea.value, textarea.selectionStart);
  updateEditorChecklistState();
  updateEditorSyntaxHighlight();
  triggerAutoSave();
}

function insertTextIntoEditor(prefix, suffix = '', defaultText = '') {
  const el = dom.editorContentInput;
  if (!el) return;

  if (el.tagName !== 'TEXTAREA' && el.tagName !== 'INPUT') {
    el.focus();
    const imgMatch = prefix.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      document.execCommand('insertHTML', false, `<div class="card-inline-image"><img src="${imgMatch[2]}" alt="${escapeHtml(imgMatch[1])}" /></div><div><br></div>`);
    } else {
      document.execCommand('insertHTML', false, prefix + suffix);
    }
    triggerAutoSave();
    pushNoteHistory(el.innerHTML, 0);
    return;
  }

  const start = el.selectionStart || 0;
  const end = el.selectionEnd || 0;
  const text = el.value || '';
  const selected = text.substring(start, end) || defaultText;

  const insertion = prefix + selected + suffix;
  el.value = text.substring(0, start) + insertion + text.substring(end);

  const newCursor = start + prefix.length + selected.length;
  el.selectionStart = newCursor;
  el.selectionEnd = newCursor;

  el.focus();
  updateEditorChecklistState();
  updateEditorSyntaxHighlight();
  triggerAutoSave();
}

function handlePopoverActionClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();

  const action = btn.getAttribute('data-action');
  executeInsertAction(action);
}

function executeInsertAction(action) {
  if (!dom.editorContentInput) return;
  dom.editorContentInput.focus();

  switch (action) {
    case 'action-undo':
      performUndo();
      break;

    case 'action-redo':
      performRedo();
      break;

    case 'format-bold':
      document.execCommand('bold', false, null);
      triggerAutoSave();
      updateEditorToolbarState();
      break;

    case 'format-italic':
      document.execCommand('italic', false, null);
      triggerAutoSave();
      updateEditorToolbarState();
      break;

    case 'format-underline':
      document.execCommand('underline', false, null);
      triggerAutoSave();
      updateEditorToolbarState();
      break;

    case 'format-bullet':
      document.execCommand('insertUnorderedList', false, null);
      triggerAutoSave();
      updateEditorToolbarState();
      break;

    case 'format-number':
      document.execCommand('insertOrderedList', false, null);
      triggerAutoSave();
      updateEditorToolbarState();
      break;

    case 'format-checklist':
      toggleOrInsertChecklist();
      break;

    case 'insert-code': {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) {
        document.execCommand('insertHTML', false, `<code class="syn-inline-code">${escapeHtml(sel.toString())}</code>`);
      } else {
        document.execCommand('insertHTML', false, `<code class="syn-inline-code">code</code>&nbsp;`);
      }
      triggerAutoSave();
      break;
    }

    case 'format-heading':
      toggleHeading();
      break;

    case 'insert-image':
      if (dom.editorHiddenImageInput) {
        dom.editorHiddenImageInput.value = '';
        dom.editorHiddenImageInput.click();
      }
      break;

    case 'insert-link': {
      const url = window.prompt('Enter link URL (e.g. https://github.com):', 'https://');
      if (url && url !== 'https://') {
        document.execCommand('createLink', false, url);
        triggerAutoSave();
      }
      break;
    }
  }
}

function handleImageUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    insertTextIntoEditor(`\n![${file.name || 'Image'}](${dataUrl})\n`);
  };
  reader.readAsDataURL(file);
}

function handleFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const sizeKb = Math.round(file.size / 1024) || 1;
  insertTextIntoEditor(`\n📎 [${file.name} (${sizeKb} KB)](#file-${encodeURIComponent(file.name)})\n`);
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
  const cleaned = cleanCorruptedFormatting(content);

  // If already contains rich editor task lines or rich HTML (headings, divs, lists):
  if (cleaned.includes('editor-task-line') || /<(h[1-6]|div|p|ul|ol|table|blockquote)[\s>]/i.test(cleaned)) {
    const temp = document.createElement('div');
    temp.innerHTML = cleaned;
    const taskRows = temp.querySelectorAll('.editor-task-line');
    taskRows.forEach((row, idx) => {
      row.className = `card-checklist-item ${row.classList.contains('checked') ? 'checked' : ''}`;
      row.setAttribute('data-line', idx);
      const textSpan = row.querySelector('.task-text');
      if (textSpan) textSpan.className = 'checklist-text';
    });
    return temp.innerHTML;
  }

  const lines = cleaned.split('\n');
  const result = [];
  let inTable = false;
  let tableRows = [];

  function flushTable() {
    if (tableRows.length > 0) {
      let tableHtml = '<table class="card-markdown-table">';
      tableRows.forEach((row, rIdx) => {
        const cells = row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.every(c => /^:?-+:?$/.test(c))) return;
        tableHtml += '<tr>';
        const tag = rIdx === 0 ? 'th' : 'td';
        cells.forEach(cell => {
          tableHtml += `<${tag}>${formatInlineMarkdown(cell, isMono)}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      result.push(tableHtml);
      tableRows = [];
    }
    inTable = false;
  }

  let checklistCounter = 0;
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // Table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2) {
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Horizontal Rule
    if (/^(?:---|___|\*{3,})\s*$/.test(trimmed)) {
      result.push('<hr class="card-divider-line" />');
      continue;
    }

    // Markdown Image
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      result.push(`<div class="card-inline-image"><img src="${escapeHtml(imgMatch[2])}" alt="${escapeHtml(imgMatch[1])}" loading="lazy" /></div>`);
      continue;
    }

    // Checklists: - [ ] or [ ]
    if (/^(?:-\s*)?\[ \]/.test(trimmed)) {
      const text = trimmed.replace(/^(?:-\s*)?\[ \]\s*/, '');
      const innerHtml = formatInlineMarkdown(text, isMono);
      result.push(`<div class="card-checklist-item" data-line="${checklistCounter++}"><span class="checkbox-box"></span><span class="checklist-text">${innerHtml}</span></div>`);
      continue;
    }
    // Checklists: - [x] or [x]
    if (/^(?:-\s*)?\[[xX]\]/.test(trimmed)) {
      const text = trimmed.replace(/^(?:-\s*)?\[[xX]\]\s*/, '');
      const innerHtml = formatInlineMarkdown(text, isMono);
      result.push(`<div class="card-checklist-item checked" data-line="${checklistCounter++}"><span class="checkbox-box"></span><span class="checklist-text">${innerHtml}</span></div>`);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '');
      result.push(`<blockquote class="card-inline-quote">${formatInlineMarkdown(text, isMono)}</blockquote>`);
      continue;
    }

    // Headings: #, ##, ###
    const h1Match = trimmed.match(/^#\s+(.*)$/);
    if (h1Match) {
      result.push(`<h2>${formatInlineMarkdown(h1Match[1], isMono)}</h2>`);
      continue;
    }
    const h2Match = trimmed.match(/^##\s+(.*)$/);
    if (h2Match) {
      result.push(`<h3>${formatInlineMarkdown(h2Match[1], isMono)}</h3>`);
      continue;
    }

    // Code lines / YAML / Syntax (except lines starting with # which are now headings)
    if (isMono || /^(name:|on:|push:|tags:|permissions:|jobs:|release:|strategy:|fail-fast:|const|let|var|function|fn|pub|struct|import|\/\/)/.test(trimmed)) {
      result.push(`<div class="code-line">${highlightCodeSyntax(line)}</div>`);
      continue;
    }

    // Standard line with inline markdown
    result.push(`<div>${formatInlineMarkdown(line, isMono)}</div>`);
  }

  if (inTable) {
    flushTable();
  }

  return result.join('');
}

function formatInlineMarkdown(text, isMono = false) {
  if (!text) return '';
  if (isMono) return highlightCodeSyntax(text);

  let formatted = text;

  // If text doesn't contain HTML tags, escape HTML special chars safely
  if (!/<(b|strong|i|em|u|del|s|a|code|span)[\s>]/i.test(formatted)) {
    formatted = escapeHtml(formatted);
  }

  // Markdown links: [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, title, url) => {
    return `<a href="${url}" class="card-inline-link" target="_blank" onclick="event.stopPropagation()">${title}</a>`;
  });
  // Bold: **text** -> strong (no symbols)
  formatted = formatted.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* -> em (no symbols)
  formatted = formatted.replace(/(?:^|[^*])\*([^\*]+)\*(?:[^*]|$)/g, (match, p1) => {
    return match.replace(`*${p1}*`, `<em>${p1}</em>`);
  });
  // Underline: <u>text</u>
  formatted = formatted.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u>$1</u>');
  // Strikethrough: ~~text~~
  formatted = formatted.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  // Inline code: `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="syn-inline-code">$1</code>');
  return formatted;
}

function highlightCodeSyntax(rawText) {
  if (!rawText) return '';

  const lines = rawText.split('\n');
  const highlightedLines = lines.map(line => {
    // 1. Checked task line: - [x] or - [X]
    const checkedMatch = line.match(/^(\s*-\s*)(\[[xX]\])(\s*)(.*)$/);
    if (checkedMatch) {
      const prefix = escapeHtml(checkedMatch[1]);
      const checkSpan = `<span class="syn-check syn-check-checked" title="Completed task"></span>`;
      const space = escapeHtml(checkedMatch[3]);
      const taskText = stripMarkdownSymbols(checkedMatch[4]);
      return `${prefix}${checkSpan}${space}<span class="syn-task-checked">${escapeHtml(taskText)}</span>`;
    }

    // 2. Unchecked task line: - [ ]
    const uncheckedMatch = line.match(/^(\s*-\s*)(\[ \])(\s*)(.*)$/);
    if (uncheckedMatch) {
      const prefix = escapeHtml(uncheckedMatch[1]);
      const checkSpan = `<span class="syn-check syn-check-unchecked" title="To-do item"></span>`;
      const space = escapeHtml(uncheckedMatch[3]);
      const taskText = stripMarkdownSymbols(uncheckedMatch[4]);
      return `${prefix}${checkSpan}${space}<span class="syn-task-unchecked">${escapeHtml(taskText)}</span>`;
    }

    // 3. Regular text line - clean plain text with no symbols
    return escapeHtml(stripMarkdownSymbols(line));
  });

  return highlightedLines.join('\n');
}

function highlightTokens(rawText) {
  return escapeHtml(stripMarkdownSymbols(rawText));
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
