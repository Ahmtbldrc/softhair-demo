# SoftHair - Modern Hair Salon Management System

A comprehensive hair salon management system built with Next.js 14, TypeScript, and Supabase. This application provides a modern, responsive interface for managing salon operations, staff, and customer appointments.

## Features

- 🔐 Authentication & Authorization
- 📅 Appointment Management
- 👥 Staff Management
- 📊 Analytics Dashboard
- 📱 Responsive Design
- 🌙 Dark/Light Mode
- 🌐 Internationalization Support

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Database & Auth:** Supabase
- **Form Handling:** React Hook Form + Zod
- **Data Visualization:** Recharts
- **Animations:** Framer Motion, GSAP
- **3D Graphics:** Three.js with React Three Fiber
- **Email:** Nodemailer
- **State Management:** React Context + Hooks

## Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase Account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Additional configurations as needed
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/softhair.git
cd softhair
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js 14 app directory
├── components/            # Reusable UI components
├── contexts/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                # Utility functions and services
├── locales/           # Internationalization files
└── middleware/       # Next.js middleware
```

## Key Features Implementation

### Authentication
- Secure authentication using Supabase Auth
- Protected routes and role-based access control

### Appointment Management
- Interactive calendar interface
- Real-time availability checking
- Automated email notifications

### Staff Management
- Staff profiles and schedules
- Performance tracking
- Service assignments

### Analytics Dashboard
- Real-time business metrics
- Custom charts and visualizations
- Revenue and appointment analytics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@softhair.com or join our Slack channel.
