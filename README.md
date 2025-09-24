# SMS Visualizer

A modern, responsive web application for visualizing and browsing SMS conversations. Built with React, Vite, and Tailwind CSS.

## Features

- 📱 **Mobile-first responsive design** - iPhone Messages-style interface, optimized for all screen sizes
- 🌙 **Dark mode support** - Auto-detects system preference, manual toggle between light/dark
- 📤 **File upload** - Load SMS data from JSON files
- 🔗 **Enhanced pastebin integration** - Multiple URL formats supported:
  - `yourdomain.com/pastebinkey`
  - `yourdomain.com?pastebin=key`
  - `yourdomain.com?p=key`
- 🔍 **Contact search** - Find conversations quickly
- 🔎 **Message search** - Search within conversation messages
- 💬 **Message threading** - View conversations chronologically
- ⏰ **Maldivian time** - All timestamps converted to GMT+5
- ⚡ **Lazy loading** - Load more messages on demand for performance
- 🚀 **Fast loading** - Built with Vite for optimal performance

## Usage

### Uploading SMS Data

1. **File Upload**: Click the "Upload" button and select a JSON file containing your SMS data
2. **Pastebin URL**: Share pastebin data by visiting `yourdomain.com/[pastebinkey]`

### Expected JSON Format

```json
[
  {
    "id": 1,
    "party": {
      "direction": "from", // or "to"
      "phone": "+1234567890",
      "name": "Contact Name"
    },
    "time": {
      "date": "01/10/2014",
      "time": "10:46:46(UTC+0)"
    },
    "message": "Message content",
    "status": "Read" // or "Unread", "Sent"
  }
]
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repository
git clone [repository-url]
cd bro-sms

# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

### GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages:

1. Push to the `main` branch
2. GitHub Actions will automatically build and deploy
3. The site will be available at `https://yourusername.github.io/bro-sms/`

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **GitHub Pages** - Hosting

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details