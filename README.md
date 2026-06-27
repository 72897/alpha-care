# Alpha-Care
Alpha-Care is a state-of-the-art virtual health and wellness companion application built with Next.js 15, React 19, Tailwind CSS, Google Gemini 2.5 Flash, Firebase, and Vapi.

## Key Features & User Workflow

### 1. Interactive AI Health Chatbot
- **Conversational Health Companion:** Accessible via the `/chat` route.
- **Checkup Context Awareness:** The chatbot automatically queries the user's past wellness checkup history (last 10 feedbacks) from Firestore and tailors responses based on their scores, sleep quality, stress levels, strengths, and areas for improvement.
- **History Persistence:** Chat history is stored locally in client-side `localStorage` so it persists securely across page refreshes. A **"Clear Chat"** button is provided to reset the state.
- **Short & Direct Answers:** Designed to provide concise, doctor-like guidance (restricted to 2-3 sentences or direct bullet points) for optimal readability.

### 2. Conversational Voice Checkups (Vapi Integration)
- **Virtual Health Assessment:** Users can start interactive vocal wellness checkups. The application uses Vapi and Google Gemini 2.5 Flash (`gemini-2.5-flash`) to generate structured health questions and dialogue dynamically.
- **Vitals & Metrics Recording:** Conducts assessments across key health pillars: sleep quality, nutritional balance, stress & mental wellness, physical activity, and vital signs.

### 3. Detailed Checkup History & Reports
- **Checkup Log Dashboard:** Located under `/history`, users can review card summaries of all completed assessments.
- **Comprehensive Feedback Reports:** Each checkup log is evaluated to calculate an overall health score (out of 100) along with detailed category breakdowns, key strengths, actionable improvement areas, and a final doctor's clinical assessment.
- **PDF Report Downloads:** Users can download a formal offline PDF copy of their wellness checkup reports directly from their profile page.

### 4. Interactive Trend Visualization
- **SVG Progress Chart:** Located on the profile page, a dependency-free interactive SVG Trend Chart tracks the overall health score changes over time.
- **Hover Annotations:** Hovering over chart data points opens a custom glassmorphism tooltip showing the date, total score, and category-level scores.

### 5. Customizable Profile Goals
- **Personalized Goals:** Users can edit their display name and set a target health goal (General Wellness, Improve Sleep, Reduce Stress, Nutritional Balance, or Physical Fitness).
- **Secure Account Actions:** Supports quick navigation and secure account sign-outs or permanent profile deletions.

---

## Tech Stack
- **Framework:** Next.js (App Router)
- **UI & Iconography:** Tailwind CSS, Lucide React, React Icons
- **AI Core:** Google Gemini 2.5 Flash (via `@ai-sdk/google` & `ai`), Vapi
- **Database & Auth:** Firebase Firestore (Admin SDK on backend, Client SDK on frontend)
- **PDF Generation:** Client-side HTML-to-PDF generation

---

## Setup & Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/72897/alpha-care.git
   cd alpha-care
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   # Google Gemini API (Ensure this and the other variables below are added to your deployment/Vercel environment variables)
   GEMINI_API_KEY=your_gemini_api_key

   # Firebase Client Config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

   # Firebase Admin Credentials
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_PRIVATE_KEY="your_firebase_private_key"
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in the browser.
