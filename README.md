# PetMatch 🐾 – HackKind x Sequoia Humane Society x Opportunity Hack

## 📝 Project Overview

**PetMatch** is a full-stack web application designed to:

- **Match adopters with pets** using a smart questionnaire and vector-based recommendation engine.
- **Streamline visit scheduling** for potential adopters to meet pets.
- **Empower admins** to manage pets, adoption requests, and visits efficiently.
- **Enhance user experience** with a modern, responsive UI and real-time feedback.

## 📌 Problem Statement

**Sequoia Humane Society** faces challenges in efficiently matching adoptable pets with potential adopters, managing visit requests, and streamlining the adoption process. The current process is manual, time-consuming, and lacks personalized recommendations, leading to longer shelter stays for pets and missed connections with adopters.

## 🚀 Features

- **Personalized Pet Matching:** Adopters fill out a two-step questionnaire; the backend computes a compatibility score and recommends pets.
- **Admin Dashboard:** Manage pets, view and approve visit requests, update pet status, and bulk actions.
- **Adopter Dashboard:** View matches, request visits, and track adoption progress.
- **Visit Scheduling:** Users can schedule visits with available pets; admins can confirm or cancel requests.
- **Image Uploads:** Pet images are uploaded securely to AWS S3.
- **Authentication & Authorization:** Secure login, signup, and role-based access (admin/adopter).
- **Email Notifications:** Automated emails for visit confirmations and reminders.

## 🎥 Project Walkthrough

### Landing Page
![HackKind-SequoiaHumaneSociety](https://i.imgur.com/cnFDHx7.png)

### Login & Signup  
![HackKind-SequoiaHumaneSociety](https://i.imgur.com/qdpF3wG.png)  
![HackKind-SequoiaHumaneSociety](https://i.imgur.com/oJYwAJy.png)

### Questionarie
![HackKind-SequoiaHumaneSociety](docs%20&%20media/Questionarie%20Walktrough.gif)


### Matches Page
![HackKind-SequoiaHumaneSociety](docs%20&%20media/Matches%20Page.gif)

### Pets Page
![HackKind-SequoiaHumaneSociety](docs%20&%20media/Pets%20Page.gif)

### Adopter Dashboard
![HackKind-SequoiaHumaneSociety](https://i.imgur.com/IViYINh.png)

### Admin Dashboard
![HackKind-SequoiaHumaneSociety](docs%20&%20media/Admin%20Dashboard.gif)

### 🧪 Try It Yourself  
[**Visit The Live Site**](link)

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **APIs:** OpenAI (Pet Summaries), AWS S3 (Image Uploads), MailerSend (Email Notifications)
- **Deployment:** Render (Backend & Database), Vercel (Frontend)

## 📄 License

[MIT License](LICENSE)

