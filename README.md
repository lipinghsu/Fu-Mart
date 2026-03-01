# <a href="https://www.fu-mart.com/">Fü-Mart</a>
A modern online marketplace designed for a seamless and responsive shopping experience.

## Features

- Dark mode support  
- Product search and category browsing
- Multi-language and multi-currency system  
- Firebase authentication and real-time database  
- Shopping cart with item and bag clearing functions  
- Admin panel for managing products, brands, and origins  
- Responsive interface optimized for both desktop and mobile devices  

## Tech Stack

- SCSS (Styling)
- Vite (Build tool)  
- Node.js (Backend)  
- React (Front-end)  
- Stripe (Payment Integration)
- Firebase (Authentication, Database, and Hosting)  

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/lipinghsu/fu-mart.git
   cd fu-mart
   npm install
   npm run dev
   ```

2. The application uses Vite and runs on `http://localhost:5173` by default.

## Project Structure

```
fu-mart/
├── src/
│   ├── components/        # Reusable React components
│   ├── pages/             # Page-level views
│   ├── firebase/          # Firebase configuration and utilities
│   ├── assets/            # Static images and icons
│   ├── styles/            # Global SCSS files
│   └── App.jsx            # Root component
├── public/                # Static assets
└── README.md
```

## License

This project is licensed under the MIT License.