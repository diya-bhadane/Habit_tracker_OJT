# 🚀 Habitrix — MERN Habit Tracking Web App

Habitrix is a full-stack **MERN (MongoDB, Express.js, React.js, Node.js)** habit-tracking web app built as part of my **On-the-Job Training (OJT)** project.  
It helps users build habits, track consistency, log moods, and visualize progress through clean UI and interactive analytics.

This project represents what I learned during my MERN journey — from designing the frontend in React, setting up backend APIs, integrating MongoDB, handling authentication, and building a user-friendly dashboard.

---

## 🌟 Features

### User Authentication  
- Secure signup & login  
- JWT-based authentication  
- Separate data for each user  

### Habit Management  
- Add, edit, delete habits  
- Mark habits daily  
- Track streaks & consistency  
- Organized "My Habits" page  

### Analytics Dashboard  
- Built using **Recharts**  
- Weekly / monthly analytics  
- Line charts, bar charts, streak data  
- Understand consistency visually  

### Mood Tracker  
- Daily mood logging  
- View mood patterns  
- Simple & intuitive UI  

### Dashboard  
- Shows all today's habits  
- Quick progress overview  

### Community Page (UI)  
- Placeholder page for future community features  

### Settings Page  
- Profile settings (basic UI)  
- Logout  

### Fully Responsive  
- Works smoothly on all screen sizes  

---

## 🛠️ Tech Stack

### **Frontend**
- React.js  
- React Router  
- Recharts  
- CSS / Tailwind (depending on your folder setup)

### **Backend**
- Node.js  
- Express.js  
- MongoDB + Mongoose  
- JWT Authentication  
- Dotenv  

### **Tools**
- VS Code  
- Git & GitHub  
- Postman  
- Vite  

---

## 📂 Folder Structure

Based on your actual project:

```
Habit_tracker_OJT/
│
├── Backend/
│   ├── models/
│   │   ├── Challenge.js
│   │   ├── CommunityPost.js
│   │   └── User.js
│   │
│   ├── node_modules/
│   ├── server.js
│   ├── package.json
│   └── .env  (you must manually create)
│
│
├── src/
│   ├── components/
│   │   ├── CTA.jsx
│   │   ├── Features.jsx
│   │   ├── Footer.jsx
│   │   ├── Hero.jsx
│   │   ├── Logo.jsx
│   │   ├── Navbar.jsx
│   │   └── Testimonials.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   ├── Analytics.jsx
│   │   │   ├── Community.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── HabitCard.jsx
│   │   │   ├── MoodTracker.jsx
│   │   │   ├── MyHabits.jsx
│   │   │   ├── QuickNote.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StreakCard.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── WeeklyChart.jsx
│   │   │   └── Landing.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   │
│   ├── utils/
│   │   ├── apiClient.js
│   │   └── moodStorage.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
├── vite.config.js
└── README.md
```

---

# ⚙️ Installation & Setup Guide

Habitrix has two separate environments:
- 📌 one for the backend
- 📌 one for the frontend

Follow the steps below 👇

---

## 1. Clone the Repository

```bash
git clone https://github.com/Adii-45/Habit_tracker_OJT
cd Habit_tracker_OJT
```


---

# 🔧 Backend Setup

Navigate to the backend folder:

```bash
cd Backend
npm install
```

### 📝 Create a `.env` file inside `/Backend`

Your `.env` file should contain:

```
MONGO_URL=your_mongodb_connection_string
PORT=5000
```

### ▶️ Run the backend server

```bash
npm run dev
```

Your backend runs on:  
👉 http://localhost:5000


---

# 🎨 Frontend Setup

Go back to the main project folder and run:

```bash
cd ..
npm install
npm run dev
```

Your frontend runs on:  
👉 http://localhost:5173  


---

# 🧪 Testing the App

### **API Endpoints (Backend)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register user |
| POST | `/auth/login` | Login user |
| POST | `/habits` | Create new habit |
| GET | `/habits` | Get all habits |
| PUT | `/habits/:id` | Update habit |
| DELETE | `/habits/:id` | Delete habit |
| POST | `/moods` | Log daily mood |
| GET | `/moods` | Mood history |

---

# 📸 Screenshots 

## Landing Page
<img width="1800" height="1041" alt="Screenshot 2025-12-04 at 10 13 00 AM" src="https://github.com/user-attachments/assets/5a5c6289-1843-4891-97a5-741c5d416779" />

## Dashboard
<img width="1800" height="1039" alt="Screenshot 2025-12-04 at 10 14 01 AM" src="https://github.com/user-attachments/assets/16d35afe-b9c6-4913-be23-39d1f3f999cd" />

## My Habits
<img width="1800" height="1039" alt="Screenshot 2025-12-04 at 10 14 25 AM" src="https://github.com/user-attachments/assets/95e18dc9-c2a6-41b2-ba7b-26c2091199c7" />

## Analytics
<img width="1800" height="1040" alt="Screenshot 2025-12-04 at 10 14 50 AM" src="https://github.com/user-attachments/assets/555e1f14-c15c-43e6-be0d-feda7a96f10a" />

## Mood Tracker
<img width="1800" height="1040" alt="Screenshot 2025-12-04 at 10 15 15 AM" src="https://github.com/user-attachments/assets/dc8b60a1-6b1a-487d-9e78-98e91603f9e5" />

---

# 🚀 Future Enhancements

- Mobile app version (Flutter / React Native)  
- Pomodoro timer  
- Calendar-based analytics  
- AI habit suggestions  
- Community leaderboard  

---

# 👨‍💻 Author

**Aditya Kumar Nayak & Yatin Jamwal**  
Polaris School of Technology  
OJT Project - Backend Developer Associate

GitHub: **https://github.com/Adii-45 & https://github.com/YATIN072007/**

---
