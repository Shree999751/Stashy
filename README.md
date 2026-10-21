# Stashy (Stash your thought) 🗂️

> **"Notes that live on the edge of your screen"**  
> A lightweight, beautiful desktop note-taking app built with **Tauri v2 + Rust + Vanilla JS & CSS**. Inspired by minimal, high-efficiency edge-docked workflows.

---

## ✨ Features

- **📍 8 Edge Screen Dock Positions**:
  - `Right-Top`, `Right-Bottom`
  - `Left-Top`, `Left-Bottom`
  - `Top-Left`, `Top-Right`
  - `Bottom-Left`, `Bottom-Right`
  - Smooth collapsible edge handle, persistent hover peek, and quick `(+)` thought stashing.

- **🎨 6 Signature Note Themes**:
  - Yellow, Green, Purple, Blue, Red
  - **Dark / CLI Terminal Theme (`#18181b`)**: Matte charcoal background, glowing cyan terminal cursor, and high-contrast neon code syntax highlighting.

- **💻 Real-Time Syntax Highlighting & Monospace Engine**:
  - Multi-language syntax tokenizer (JavaScript, TypeScript, Rust, Python, Go, YAML, shell scripts, Markdown checklists).
  - Highlights keywords (`return`, `const`, `async`, `fn`, `pub`), YAML keys (`name:`, `on:`, `push:`, `permissions:`), strings, numbers, booleans, comments, and checklist tags.

- **🔲 Free Dragging & Corner Resizing**:
  - **Drag Anywhere**: Click & hold the note header or drag grip (`⋮⋮`) to move notes freely across your desktop.
  - **Dynamic Corner Resize Handle**: Drag the bottom-right corner to freely resize width & height down to a compact sticky note or expand as needed.
  - **Compact Sticky Mode (`↕`)**: 1-click toggle between full editor and mini compact sticky size.
  - **Position Memory**: Each note remembers its exact desktop coordinates and dimensions.

- **🍅 Integrated Pomodoro Focus & Stopwatch**:
  - Customizable focus & break intervals with session progression tracking.
  - Millisecond-precision stopwatch with pause and reset controls.

- **📁 Local Markdown Storage & Sync Ready**:
  - Every note is saved as a clean `.md` file with YAML frontmatter.
  - Compatible with iCloud, Dropbox, OneDrive, Google Drive, or Git repositories.

- **🏷️ Customizable GitHub-Style Labels**:
  - Manage and rename color labels in **Set labels**.
  - Quick filter notes by label with one click.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust & Cargo](https://rustup.rs/) (stable)
- OS Build tools:
  - **Windows**: Microsoft C++ Build Tools & WebView2
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`

### Development

```bash
# 1. Clone repository
git clone https://github.com/your-username/stashy.git
cd stashy

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run native desktop application
npm run tauri dev
```

### Production Build & Packaging

```bash
# Build web production bundle
npm run build

# Build native desktop installers (.exe, .msi on Windows; .dmg on macOS; .deb/.AppImage on Linux)
npm run tauri build
```

---

## 🛠️ Architecture

- **Backend**: Rust 2024 edition, Tauri v2, local filesystem I/O, multi-workspace storage.
- **Frontend**: Lightweight vanilla ES modules, custom design system, zero external heavy frontend framework bloat.
- **Memory Footprint**: ~28 MB idle memory usage with instant edge responsiveness.

---

## 📄 License

MIT License. Designed with care for makers, coders, and thinkers.
