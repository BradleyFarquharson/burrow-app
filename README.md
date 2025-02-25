# Burrow

A visual exploration tool for brainstorming and organizing ideas. Burrow helps you explore concepts through an interactive canvas, allowing you to create connections between ideas and dive deeper into topics.

## Features

- **Interactive Canvas**: Visualize your ideas in a spatial environment
- **AI-Powered Exploration**: Generate related ideas and branches using Gemini AI
- **Drag and Drop Interface**: Easily organize and connect your thoughts
- **Zoom Controls**: Navigate through complex idea maps with intuitive controls
- **Save and Share**: Store your explorations and share them with others

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **AI Integration**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/burrow.git
   cd burrow
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

The app can be deployed to Firebase Hosting:

1. Install Firebase CLI
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase
   ```
   firebase login
   ```

3. Initialize Firebase
   ```
   firebase init
   ```

4. Build the app
   ```
   npm run build
   ```

5. Deploy to Firebase
   ```
   firebase deploy
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by tools like Miro, Figma, and mind mapping applications
- Built with the power of Next.js and Firebase
