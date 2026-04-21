/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(215 10% 65%)",
        input: "hsl(215 10% 65%)",
        ring: "hsl(215 20.2% 55%)",
        background: "hsl(224 20% 10%)",
        foreground: "hsl(210 20% 90%)",
        primary: {
          DEFAULT: "hsl(215 60% 50%)",
          foreground: "hsl(210 20% 90%)",
        },
        secondary: {
          DEFAULT: "hsl(215 15% 25%)",
          foreground: "hsl(210 20% 90%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(210 20% 90%)",
        },
        muted: {
          DEFAULT: "hsl(215 15% 20%)",
          foreground: "hsl(215 10% 65%)",
        },
        accent: {
          DEFAULT: "hsl(215 60% 50%)",
          foreground: "hsl(210 20% 90%)",
        },
        card: {
          DEFAULT: "hsl(224 20% 12%)",
          foreground: "hsl(210 20% 90%)",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
}
