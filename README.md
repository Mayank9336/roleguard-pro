RBAC Configuration Tool
A modern, full-stack Role-Based Access Control (RBAC) management system built with Next.js 14, TypeScript, MySQL, and Prisma. This tool provides an intuitive interface for managing users, roles, and permissions with optional AI-powered natural language configuration.
🔐 
AI Assistant (Bonus Feature)
Show Image
🚀 Features
Core Features

✅ Custom Authentication System

JWT-based authentication
Bcrypt password hashing
Secure session management
Protected routes


✅ Permission Management

Create, Read, Update, Delete (CRUD) permissions
Detailed permission descriptions
Track permission usage across roles


✅ Role Management

Full CRUD operations for roles
Role descriptions and metadata
View assigned users and permissions


✅ Role-Permission Assignment

Intuitive drag-and-drop interface
Assign multiple permissions to roles
Real-time permission tracking
Remove permissions from roles


✅ Modern UI/UX

Responsive design for all devices
Clean, intuitive interface
Real-time updates
Loading states and error handling



🎁 Bonus Feature: AI-Powered Natural Language Interface

Parse natural language commands to manage RBAC
Powered by Google Gemini AI
Examples:

"Create a new role called Content Editor"
"Give the Content Editor role the permission to edit articles"
"Remove delete permission from Viewer role"



🛠️ Tech Stack
Frontend

Framework: Next.js 14 (App Router)
Language: TypeScript
Styling: Tailwind CSS
UI Components: Custom components with Tailwind

Backend

API: Next.js API Routes
Database: MySQL
ORM: Prisma
Authentication: JWT + bcryptjs
