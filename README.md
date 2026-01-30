# CyberQuest - Cyber Gamified Learning Platform

A comprehensive, gamified cybersecurity learning platform that combines interactive missions, leaderboards, and progress tracking to make cybersecurity education engaging and fun.

## 🎮 Overview

CyberQuest is a full-stack web application designed to teach cybersecurity concepts through gamified missions and challenges. Users can complete cybersecurity tasks, earn badges, climb the leaderboard, and track their progress on a structured learning roadmap.

## 🏗️ Project Structure

```
cyber-gamified-learning/
├── frontend/              # React-based user interface
├── backend/               # Node.js/Express API server
├── ai-engine/             # Python AI service for mission generation
└── database/              # Database configuration and schemas
```

## 🚀 Features

- **Interactive Missions**: Cybersecurity challenges with real-world scenarios
- **Mission Generation**: AI-powered mission creation with difficulty analysis
- **User Authentication**: Secure login and registration system
- **Progress Tracking**: Monitor learning progress and achievements
- **Leaderboard System**: Compete and compare with other users
- **Badge System**: Earn badges for completing missions
- **Admin Dashboard**: Manage users, missions, and platform content
- **Responsive Design**: Works on desktop and mobile devices

## 📋 Tech Stack

### Frontend
- **React.js**: UI framework
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing
- **CSS3**: Styling and animations

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: Database
- **Passport.js**: Authentication
- **Jest**: Testing framework

### AI Engine
- **Python**: AI/ML implementation
- **Flask/FastAPI**: API endpoints
- **scikit-learn**: Machine learning library

## 🔧 Installation

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI and other configurations
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### AI Engine Setup
```bash
cd ai-engine
pip install -r requirements.txt
python api/ai_api.py
```

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

### AI Engine (.env)
```
FLASK_ENV=development
FLASK_APP=api/ai_api.py
```

## 🗄️ Database Schema

The application uses MongoDB with the following main collections:
- **Users**: User accounts and profiles
- **Missions**: Cybersecurity challenges and missions
- **Progress**: User progress on missions
- **Badges**: Achievement badges
- **Roadmap**: Learning path structure
- **Topics**: Learning topics and categories
- **ContactMessages**: User feedback and inquiries

## 🎯 Getting Started

1. Clone the repository
2. Follow the installation steps for each component
3. Start the backend server
4. Start the frontend development server
5. Access the application at `http://localhost:3000`

## 📚 API Documentation

The backend provides REST API endpoints for:
- Authentication (login, register, password reset)
- User management (profile, progress)
- Mission operations (list, get, submit solutions)
- Leaderboard (rankings, user stats)
- Admin operations (manage users, missions, badges)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Hrushitha** - Initial development and project lead

## 🙋 Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Contact through the in-app feedback form
- Check the FAQ section in the application

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for session management
- Input validation and sanitization
- CORS enabled for secure cross-origin requests

## 📊 Future Enhancements

- Multi-language support
- Advanced analytics and insights
- Real-time multiplayer challenges
- Mobile app versions
- Certification programs
- Integration with industry tools

---

**Happy Learning! 🛡️ Stay Cyber Safe!**
