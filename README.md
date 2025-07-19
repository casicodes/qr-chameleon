# QR Chameleon 🦎

A dynamic QR code generator that creates persistent QR codes with updatable destinations. Generate once, update anytime!

## ✨ Features

- **Dynamic QR Codes**: Create QR codes that point to short URLs, which can be updated later without regenerating the QR code
- **Multiple Formats**: Support for PNG, SVG, and JPG formats
- **Color Customization**: Choose from preset colors or use a custom color picker
- **Real-time Preview**: See your QR code as you type
- **QR Management**: Update destination URLs using the QR ID
- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (Supabase recommended)

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   - Create a PostgreSQL database (Supabase recommended)
   - Update the `DATABASE_URL` in your environment variables
   - Run Prisma migrations:
     ```bash
     npx prisma generate
     npx prisma db push
     ```

3. **Start the backend server:**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:4000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

## 📖 How It Works

1. **Generate QR Code**: Enter a destination URL, choose color and format, then generate your QR code
2. **Get QR ID**: Copy the unique QR ID that's generated for your QR code
3. **Update Later**: Use the QR ID to update the destination URL without regenerating the QR code
4. **Manage**: Visit `/manage` to update existing QR codes

## 🔧 API Endpoints

- `POST /api/qr` - Create a new dynamic QR code
- `GET /redirect/:shortId` - Redirect to the original URL
- `PUT /api/qr/:shortId` - Update QR code destination
- `GET /api/qr/:shortId` - Get QR code information

## 🛠️ Tech Stack

**Backend:**
- Node.js with Express
- PostgreSQL with Prisma ORM
- QRCode library for QR generation
- Sharp for image processing

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- React hooks for state management

## 📱 Usage

1. **Generate QR Code:**
   - Enter a valid URL in the destination field
   - Choose your preferred color and format
   - The QR code will generate automatically
   - Download the QR code or copy the QR ID

2. **Manage QR Codes:**
   - Click the "Manage" button (gear icon) in the top right
   - Enter the QR ID you copied earlier
   - Update the destination URL
   - The same QR code will now redirect to the new URL

## 🔒 Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**QR Chameleon** - Because QR codes should be as flexible as chameleons! 🦎✨ 