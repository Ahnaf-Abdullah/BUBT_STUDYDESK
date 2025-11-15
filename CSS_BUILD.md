# Tailwind CSS Setup

This project uses **local Tailwind CSS** instead of the CDN version for better performance and customization.

## 📦 Installation

Tailwind CSS dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## 🔨 Build Commands

### Build CSS once (for production)

```bash
npm run build:css
```

### Watch mode (for development)

```bash
npm run watch:css
```

This will automatically rebuild CSS when you make changes to:

- HTML files
- JavaScript files
- CSS input file

## 📁 File Structure

- **`css/input.css`** - Source file with Tailwind directives
- **`css/output.css`** - Generated CSS file (used by the website)
- **`tailwind.config.js`** - Tailwind configuration
- **`postcss.config.js`** - PostCSS configuration

## 🎨 Customization

Edit `tailwind.config.js` to customize:

- Colors
- Spacing
- Fonts
- Breakpoints
- And more!

## 🚀 Deployment

Make sure to run `npm run build:css` before deploying to generate the optimized CSS file.

The `css/output.css` file should be committed to the repository so it's available in production.
