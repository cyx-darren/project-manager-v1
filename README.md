# Project Manager v1

A modern, responsive project management application inspired by Asana, built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### ✅ Completed Features
- **Responsive Layout System**: Professional header, collapsible sidebar, and main content area
- **Mobile-First Design**: Adaptive layout that works seamlessly across devices
- **Modern UI Components**: Custom Tailwind CSS components with consistent styling
- **TypeScript Support**: Full type safety and excellent developer experience
- **Component Architecture**: Well-structured, reusable React components

### 🎨 UI Components
- **Header**: Search functionality, notifications, user menu with dropdown
- **Sidebar**: Navigation menu, collapsible project list, quick actions
- **Dashboard**: Statistics cards, recent tasks, and quick action buttons
- **Responsive Behavior**: Mobile overlay sidebar, desktop persistent sidebar

### 🛠️ Technical Stack
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom component classes
- **Build Tool**: Vite for fast development and building
- **Task Management**: Integrated with Taskmaster AI for project planning

## 📋 Planned Features
- [ ] User Authentication (Supabase Auth)
- [ ] Project Management (CRUD operations)
- [ ] Task Management with Kanban boards
- [ ] Calendar view for task scheduling
- [ ] Multi-user collaboration
- [ ] Real-time updates
- [ ] Drag-and-drop functionality

## 🏗️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cyx-darren/project-manager-v1.git
cd project-manager-v1
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── components/
│   └── layout/
│       ├── Header.tsx      # Top navigation bar
│       ├── Sidebar.tsx     # Side navigation menu
│       ├── Layout.tsx      # Main layout wrapper
│       └── index.ts        # Component exports
├── pages/
│   └── Dashboard.tsx       # Main dashboard page
├── index.css              # Global styles with Tailwind
└── App.tsx                # Root application component
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue theme (`primary-500`, `primary-600`, `primary-700`)
- **Gray Scale**: Consistent gray tones for text and backgrounds
- **Status Colors**: Green (success), Yellow (warning), Red (error)

### Component Classes
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons  
- `.card` - Content card containers
- `.input-field` - Form input styling

## 📱 Responsive Design

The application is built with a mobile-first approach:

- **Mobile (< 768px)**: Sidebar slides in as overlay
- **Desktop (≥ 768px)**: Sidebar persistent, content adapts with padding
- **Transitions**: Smooth animations between responsive states

## 🔄 Development Progress

This project follows a structured development approach using Taskmaster AI for task management:

### Current Status: **Task 2 - Frontend Setup** (In Progress)
- ✅ React + Vite initialization
- ✅ Tailwind CSS configuration  
- ✅ Layout components implementation
- ⏳ Environment configuration
- ⏳ React Router setup
- ⏳ End-to-end testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Design inspiration from Asana
- Built with modern React ecosystem tools
- Task management powered by Taskmaster AI
